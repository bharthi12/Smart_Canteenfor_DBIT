package com.canteen.repository;

import com.canteen.entity.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByAvailableTrue();
    List<Dish> findAllByOrderByCategoryAscNameAsc();
}
