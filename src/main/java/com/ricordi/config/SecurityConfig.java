package com.ricordi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for REST API endpoints
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/", "/album-demo", "/login", "/register", "/error",
                                "/api/prompts/**", "/api/journal/**", "/api/photos/**",
                                "/data/**",
                                "/css/**", "/js/**", "/images/**", "/fonts/**", "/uploads/**", "/vendor/**",
                                "/favicon.ico"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .permitAll()
                )
                .logout(Customizer.withDefaults());

        return http.build();
    }
}
