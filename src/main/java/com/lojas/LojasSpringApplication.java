package com.lojas;

import lombok.extern.log4j.Log4j2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@Log4j2
public class LojasSpringApplication {

	public static void main(String[] args) {
		SpringApplication.run(LojasSpringApplication.class, args);
	}
//
//        @Bean
//	public WebMvcConfigurer corsConfigurer() {
//		return new WebMvcConfigurer() {
//                        @Override
//			public void addCorsMappings(CorsRegistry registry) {
//                            log.debug("Teste CORS 1");
//				registry.addMapping("/evento").allowedOrigins("http://localhost:3000");
//			}
//		};
//	}
        
}
