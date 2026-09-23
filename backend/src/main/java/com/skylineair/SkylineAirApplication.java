package com.skylineair;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SkylineAirApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkylineAirApplication.class, args);
        System.out.println("✈️ SkyLine Air Backend Application Started Successfully!");
    }
}
