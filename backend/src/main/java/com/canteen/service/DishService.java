package com.canteen.service;

import com.canteen.dto.dish.DishResponse;
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
}
