package com.canteen.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Forwards client-side Single-Page Application (SPA) routes to index.html
 * when frontend is served directly by the Spring Boot server.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        // If file exists (e.g. assets/*.js, *.css, favicon.ico), serve it.
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        // Non-API and non-WebSocket routes are forwarded to index.html for React Router
                        if (!resourcePath.startsWith("api") && !resourcePath.startsWith("ws")) {
                            return location.createRelative("index.html");
                        }
                        return null;
                    }
                });
    }
}
