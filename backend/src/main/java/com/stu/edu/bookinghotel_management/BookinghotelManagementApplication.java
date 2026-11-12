package com.stu.edu.bookinghotel_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BookinghotelManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookinghotelManagementApplication.class, args);
	}

}
