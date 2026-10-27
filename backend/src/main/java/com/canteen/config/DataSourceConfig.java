package com.canteen.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Custom DataSource configuration that auto-detects and converts Render's
 * DATABASE_URL (postgres://...) into a standard JDBC PostgreSQL connection URL.
 * Falls back to standard DataSourceProperties (DB_URL / application.properties) when not running on Render.
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (StringUtils.hasText(databaseUrl) && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            try {
                log.info("Detected Render PostgreSQL DATABASE_URL. Configuring PostgreSQL DataSource automatically...");
                URI uri = new URI(databaseUrl);
                String userInfo = uri.getUserInfo();
                String username = properties.getUsername();
                String password = properties.getPassword();

                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }

                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                if (path != null && path.startsWith("/")) {
                    path = path.substring(1);
                }

                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + path;
                if (uri.getQuery() != null) {
                    jdbcUrl += "?" + uri.getQuery();
                }

                HikariDataSource ds = new HikariDataSource();
                ds.setDriverClassName("org.postgresql.Driver");
                ds.setJdbcUrl(jdbcUrl);
                ds.setUsername(username);
                ds.setPassword(password);
                return ds;
            } catch (Exception e) {
                log.warn("Failed to parse DATABASE_URL as URI, falling back to standard DataSourceProperties: {}", e.getMessage());
            }
        }

        // Standard fallback to DB_URL / application.properties
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }
}
