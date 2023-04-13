import { useAtomValue } from "jotai";
import { Box } from "@axelor/ui";
import { String } from "../string";
import { FieldContainer, FieldProps } from "../../builder";

export function Email(props: FieldProps<string>) {
  const {
    schema: { uid, showTitle = true },
    readonly,
    widgetAtom,
    valueAtom,
  } = props;
  const value = useAtomValue(valueAtom);
  const {
    attrs: { title },
  } = useAtomValue(widgetAtom);
  if (readonly) {
    return (
      value && (
        <FieldContainer readonly={readonly}>
          {showTitle && <label htmlFor={uid}>{title}</label>}
          <Box as="a" target="_blank" href={`mailto:${value}`}>
            {value}
          </Box>
        </FieldContainer>
      )
    );
  }
  return <String {...props} inputProps={{ type: "email" }} />;
}
