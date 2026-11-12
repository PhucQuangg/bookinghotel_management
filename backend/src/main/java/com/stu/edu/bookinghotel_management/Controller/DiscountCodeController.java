package com.stu.edu.bookinghotel_management.Controller;

import com.stu.edu.bookinghotel_management.dto.discount.DiscountPreviewRequest;
import com.stu.edu.bookinghotel_management.dto.discount.DiscountPreviewResponse;
import com.stu.edu.bookinghotel_management.service.DiscountService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/discount-codes")
@RequiredArgsConstructor
public class DiscountCodeController {

    private final DiscountService discountService;

    @PostMapping("/validate")
    public DiscountPreviewResponse validateDiscount(
            @RequestBody DiscountPreviewRequest request
    ) {
        return discountService.previewDiscount(request);
    }
}