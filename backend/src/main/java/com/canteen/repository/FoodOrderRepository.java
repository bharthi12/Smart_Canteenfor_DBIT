package com.canteen.repository;

import com.canteen.entity.FoodOrder;
import com.canteen.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    @Query("SELECT DISTINCT o FROM FoodOrder o LEFT JOIN FETCH o.items WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<FoodOrder> findByUserIdWithItems(@Param("userId") Long userId);

    @Query("SELECT DISTINCT o FROM FoodOrder o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<FoodOrder> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM FoodOrder o LEFT JOIN FETCH o.items WHERE o.status IN :statuses ORDER BY o.createdAt ASC")
    List<FoodOrder> findByStatusInWithItemsAsc(@Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT DISTINCT o FROM FoodOrder o LEFT JOIN FETCH o.items WHERE o.status IN :statuses ORDER BY o.createdAt DESC")
    List<FoodOrder> findByStatusInWithItemsDesc(@Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT DISTINCT o FROM FoodOrder o LEFT JOIN FETCH o.items WHERE o.status = :status ORDER BY o.createdAt ASC")
    List<FoodOrder> findByStatusWithItemsAsc(@Param("status") OrderStatus status);

    Optional<FoodOrder> findByTokenNumber(String tokenNumber);

    long count();
}
