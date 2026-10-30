package com.canteen.service;

import com.canteen.dto.dish.DishResponse;
import com.canteen.dto.dish.SaveDishRequest;
import com.canteen.entity.Dish;
import com.canteen.exception.ResourceNotFoundException;
import com.canteen.repository.DishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DishService {

    private final DishRepository dishRepository;

    public DishService(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
    }

    @Transactional(readOnly = true)
    public List<DishResponse> getAllDishes(Boolean availableOnly) {
        List<Dish> dishes;
        if (Boolean.TRUE.equals(availableOnly)) {
            dishes = dishRepository.findByAvailableTrue();
        } else {
            dishes = dishRepository.findAllByOrderByCategoryAscNameAsc();
        }
        return dishes.stream().map(DishResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public DishResponse getDishById(Long id) {
        Dish dish = dishRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dish not found with id: " + id));
        return DishResponse.fromEntity(dish);
    }

    @Transactional
    public DishResponse updateAvailability(Long id, boolean available) {
        Dish dish = dishRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dish not found with id: " + id));
        dish.setAvailable(available);
        Dish saved = dishRepository.save(dish);
        return DishResponse.fromEntity(saved);
    }

    @Transactional
    public DishResponse createDish(SaveDishRequest request) {
        Dish dish = new Dish(
            request.name().trim(),
            normalizeOptionalText(request.description()),
            request.price(),
            normalizeOptionalText(request.imageUrl()),
            request.category().trim(),
            request.available()
        );
        return DishResponse.fromEntity(dishRepository.save(dish));
    }

    @Transactional
    public DishResponse updateDish(Long id, SaveDishRequest request) {
        Dish dish = dishRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dish not found with id: " + id));
        dish.setName(request.name().trim());
        dish.setDescription(normalizeOptionalText(request.description()));
        dish.setPrice(request.price());
        dish.setImageUrl(normalizeOptionalText(request.imageUrl()));
        dish.setCategory(request.category().trim());
        dish.setAvailable(request.available());
        return DishResponse.fromEntity(dishRepository.save(dish));
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
