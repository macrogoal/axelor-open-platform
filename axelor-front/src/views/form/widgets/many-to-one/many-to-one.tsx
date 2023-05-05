import { useAtom, useAtomValue } from "jotai";
import { MouseEvent, useCallback, useState } from "react";

import { usePerms } from "@/hooks/use-perms";
import { useCompletion, useEditor, useSelector } from "@/hooks/use-relation";
import { DataSource } from "@/services/client/data";
import { DataContext, DataRecord } from "@/services/client/data.types";
import { i18n } from "@/services/client/i18n";
import { toKebabCase } from "@/utils/names";

import { useAsyncEffect } from "@/hooks/use-async-effect";
import { useAtomCallback } from "jotai/utils";
import { FieldContainer, FieldProps } from "../../builder";
import { ViewerInput, ViewerLink } from "../string";
import {
  CreatableSelect,
  CreatableSelectProps,
} from "../tag-select/creatable-select";

export function ManyToOne(props: FieldProps<DataRecord>) {
  const { schema, formAtom, valueAtom, widgetAtom, readonly, invalid } = props;
  const {
    uid,
    target,
    targetName,
    targetSearch,
    widget,
    placeholder,
    formView,
    gridView,
    showTitle = true,
  } = schema;

  const [value, setValue] = useAtom(valueAtom);
  const { hasButton } = usePerms(schema);

  const {
    attrs: { title, focus, domain },
  } = useAtomValue(widgetAtom);

  const isSuggestBox = toKebabCase(widget) === "suggest-box";
  const showSelector = useSelector();
  const showEditor = useEditor();

  const search = useCompletion({
    target,
    targetName,
    targetSearch,
  });

  const handleChange = useCallback(
    (value: DataRecord | null) => {
      if (value && value.id && value.id > 0) {
        const { version, ...rec } = value;
        setValue(rec, true);
      } else {
        setValue(value, true);
      }
    },
    [setValue]
  );

  const canView = value && hasButton("view");
  const canEdit = value && hasButton("edit") && schema.canEdit === true;
  const canNew = hasButton("new") && schema.canNew === true;
  const canSelect = hasButton("select");

  const ensureName = useCallback(
    async (value: DataRecord) => {
      if (value && value[targetName]) {
        return value;
      }
      const id = value?.id ?? 0;
      if (id <= 0) {
        return value;
      }
      const ds = new DataSource(target);
      const rec = await ds.read(id, {
        fields: [targetName],
      });
      return {
        ...value,
        [targetName]: rec[targetName],
      };
    },
    [target, targetName]
  );

  const handleEdit = useCallback(
    async (readonly = false, record?: DataContext) => {
      showEditor({
        title: title ?? "",
        model: target,
        viewName: formView,
        record: record ?? value,
        readonly,
        onSelect: handleChange,
      });
    },
    [showEditor, title, target, formView, value, handleChange]
  );

  const handleView = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      return handleEdit(true);
    },
    [handleEdit]
  );

  const handleCreate = useCallback(
    (record?: DataContext, readonly?: boolean) => {
      return handleEdit(readonly ?? false, record);
    },
    [handleEdit]
  );

  const handleSelect = useAtomCallback(
    useCallback(
      (get) => {
        showSelector({
          title: i18n.get("Select {0}", title ?? ""),
          model: target,
          viewName: gridView,
          multiple: false,
          domain: domain,
          context: get(formAtom).record,
          onSelect: async (records) => {
            const value = await ensureName(records[0]);
            handleChange(value);
          },
        });
      },
      [
        showSelector,
        title,
        target,
        gridView,
        domain,
        formAtom,
        ensureName,
        handleChange,
      ]
    )
  );

  const handleCompletion = useAtomCallback(
    useCallback(
      async (get, set, value: string) => {
        const res = await search(value, {
          _domain: domain,
          _domainContext: get(formAtom).record,
        });
        const { records } = res;
        return records;
      },
      [domain, formAtom, search]
    )
  );

  const [selectedValue, setSelectedValue] = useState(value);

  const ensureNameValue = useAtomCallback(
    useCallback(
      async (get, set, signal: AbortSignal) => {
        if (signal.aborted) return;
        let current = selectedValue || value;
        if ((current || {}).id !== (value || {}).id) {
          current = value;
        }
        if (value && (current || {})[targetName] !== value[targetName]) {
          current = {
            ...(current || {}),
            [targetName]: value[targetName],
          };
        }
        if (
          current &&
          current.id &&
          current.id > 0 &&
          current[targetName] === undefined
        ) {
          const newValue = await ensureName(current);
          if (signal.aborted) return;
          setSelectedValue(newValue);
        } else if (current !== selectedValue) {
          setSelectedValue(current);
        }
      },
      [ensureName, selectedValue, targetName, value]
    )
  );

  useAsyncEffect(ensureNameValue, [ensureNameValue]);

  return (
    <FieldContainer>
      {showTitle && <label htmlFor={uid}>{title}</label>}
      {readonly ? (
        value && hasButton("view") ? (
          <ViewerLink onClick={handleView}>{value[targetName]}</ViewerLink>
        ) : (
          <ViewerInput value={value?.[targetName] || ""} />
        )
      ) : (
        <CreatableSelect
          autoFocus={focus}
          schema={schema}
          canCreate={canNew}
          onCreate={handleCreate as CreatableSelectProps["onCreate"]}
          onChange={handleChange}
          invalid={invalid}
          value={selectedValue ?? null}
          placeholder={placeholder}
          icons={
            isSuggestBox
              ? [{ icon: "arrow_drop_down" }]
              : [
                  {
                    hidden: !canEdit || !canView,
                    icon: "edit",
                    onClick: () => handleEdit(),
                  },
                  {
                    hidden: canEdit || !canView,
                    icon: "description",
                    onClick: () => handleEdit(true),
                  },
                  {
                    hidden: !canNew,
                    icon: "add",
                    onClick: () => handleEdit(false, { id: null }),
                  },
                  {
                    hidden: !canSelect,
                    icon: "search",
                    onClick: handleSelect,
                  },
                ]
          }
          fetchOptions={handleCompletion}
          optionLabel={targetName}
          optionValue={"id"}
        />
      )}
    </FieldContainer>
  );
}
