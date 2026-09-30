package com.temdetudo.erp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class UploadConfig implements WebMvcConfigurer {

    @Value("${erp.uploads.dir:uploads}")
    private String dir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path pasta = Path.of(dir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(pasta.toUri().toString());
    }
}
