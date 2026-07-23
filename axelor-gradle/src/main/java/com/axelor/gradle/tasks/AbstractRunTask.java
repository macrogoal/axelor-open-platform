/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.gradle.tasks;

import org.gradle.api.GradleException;
import org.gradle.api.file.FileCollection;
import org.gradle.api.plugins.JavaPluginExtension;
import org.gradle.api.provider.ProviderFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Internal;
import org.gradle.api.tasks.JavaExec;
import org.gradle.api.tasks.SourceSet;
import org.gradle.api.tasks.options.Option;
import org.gradle.jvm.toolchain.JavaToolchainService;
import org.gradle.work.DisableCachingByDefault;

import javax.inject.Inject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.jar.Attributes;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;
import java.util.stream.Collectors;

import org.gradle.work.DisableCachingByDefault;

@DisableCachingByDefault
public abstract class AbstractRunTask extends JavaExec {

    @Inject
    public AbstractRunTask() {}

    @Option(option = "config", description = "specify the application config file path.")
    public void setConfig(String config) {
        this.jvmArgs("-Daxelor.config=" + config);
    }

    @Internal
    protected abstract String getMainClassName();

    @Internal
    protected abstract File getManifestJar();

    @Override
    public ProviderFactory getProviderFactory() {
        return getProject().getProviders();
    }

    @Override
    public JavaToolchainService getJavaToolchainService() {
        return getProject().getExtensions().getByType(JavaToolchainService.class);
    }

    @Override
    public org.gradle.process.internal.ExecActionFactory getExecActionFactory() {
        return getProject().getObjects().newInstance(org.gradle.process.internal.ExecActionFactory.class);
    }

    @Override
    public org.gradle.api.internal.provider.PropertyFactory getPropertyFactory() {
        return getProject().getObjects().newInstance(org.gradle.api.internal.provider.PropertyFactory.class);
    }

    @Override
    public org.gradle.api.model.ObjectFactory getObjectFactory() {
        return getProject().getObjects();
    }

    @Override
    public org.gradle.api.provider.Property<org.gradle.jvm.toolchain.JavaLauncher> getJavaLauncher() {
        return getProject().getObjects().property(org.gradle.jvm.toolchain.JavaLauncher.class);
    }

    @Override
    public org.gradle.api.provider.Property<String> getMainModule() {
        return getProject().getObjects().property(String.class);
    }

    @Internal
    protected FileCollection getManifestClasspath() {
        return getProject()
                .getExtensions()
                .getByType(JavaPluginExtension.class)
                .getSourceSets()
                .getByName(SourceSet.MAIN_SOURCE_SET_NAME)
                .getRuntimeClasspath();
    }

    private File createManifestJar() {
        final File manifestJar = getManifestJar();
        final FileCollection classpath = getManifestClasspath();
        final String mainClass = getMainClassName();
        return createManifestJar(manifestJar, classpath, mainClass);
    }

    public static File createManifestJar(
            File manifestJar, FileCollection classpath, String mainClass) {
        final Manifest manifest = new Manifest();
        final Attributes attributes = manifest.getMainAttributes();

        try {
            Files.createDirectories(manifestJar.toPath().getParent());
        } catch (IOException e) {
            throw new GradleException("Unexpected error occurred.", e);
        }

        attributes.put(Attributes.Name.MANIFEST_VERSION, "1.0");
        attributes.put(Attributes.Name.MAIN_CLASS, mainClass);
        attributes.put(
                Attributes.Name.CLASS_PATH,
                classpath.getFiles().stream()
                        .map(File::toURI)
                        .map(Object::toString)
                        .collect(Collectors.joining(" ")));

        try (JarOutputStream jos = new JarOutputStream(new FileOutputStream(manifestJar), manifest)) {
            return manifestJar;
        } catch (IOException e) {
            throw new GradleException("Unexpected error occurred.", e);
        }
    }

    @Internal
    protected File getBuildDir() {
        return getProject().getLayout().getBuildDirectory().get().getAsFile();
    }

    @Override
    public Property<String> getMainClass() {
        super.getMainClass().set(getMainClassName());
        return super.getMainClass();
    }

    @Override
    public FileCollection getClasspath() {
        FileCollection classpath = super.getClasspath();
        File jar = createManifestJar();
        if (!classpath.contains(jar)) {
            super.classpath(jar);
        }
        return classpath;
    }
}
