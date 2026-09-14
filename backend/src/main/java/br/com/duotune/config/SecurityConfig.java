package br.com.duotune.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/auth/register", 
                    "/api/v1/auth/login",
                    "/api/v1/duos/**",
                    "/error",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html")
                .permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}