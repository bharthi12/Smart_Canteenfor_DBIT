package com.canteen.config;

import com.canteen.entity.Dish;
import com.canteen.entity.User;
import com.canteen.enums.Role;
import com.canteen.repository.DishRepository;
import com.canteen.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DishRepository dishRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(DishRepository dishRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.dishRepository = dishRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedStaffUser();
        seedDishes();
    }

    private void seedStaffUser() {
        String staffEmail = "staff@college.edu";
        if (userRepository.findByEmail(staffEmail).isEmpty()) {
            User staff = new User(
                "Canteen Head Chef & Staff",
                staffEmail,
                passwordEncoder.encode("staff123"),
                Role.STAFF
            );
            userRepository.save(staff);
            log.info("Provisioned default STAFF account: {}", staffEmail);
        }
    }

    private void seedDishes() {
        if (dishRepository.count() == 0) {
            log.info("Seeding initial canteen menu dishes...");
            List<Dish> initialDishes = List.of(
                new Dish("Crispy Masala Dosa", "Golden fermented crepe stuffed with spiced potato mash, served with coconut chutney & sambar.", new BigDecimal("60.00"), "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80", "Breakfast", true),
                new Dish("Steamed Idli Sambar (2 pcs)", "Fluffy steamed rice cakes served with aromatic lentil sambar and fresh mint chutney.", new BigDecimal("40.00"), "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80", "Breakfast", true),
                new Dish("Medu Vada (2 pcs)", "Crispy savory golden lentil donuts tempered with curry leaves and black pepper.", new BigDecimal("45.00"), "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80", "Breakfast", true),
                new Dish("Poha with Roasted Peanuts", "Light flattened rice tempered with mustard seeds, turmeric, green chilies, and crunchy peanuts.", new BigDecimal("35.00"), "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80", "Breakfast", true),
                new Dish("Chole Bhature (2 pcs)", "Spicy, rich chickpea curry served with two hot, puffed deep-fried bhature and pickled onion.", new BigDecimal("90.00"), "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80", "North Indian", true),
                new Dish("Paneer Butter Masala Meal", "Rich cottage cheese cubes in silky tomato butter gravy with 2 butter rotis and steamed basmati rice.", new BigDecimal("120.00"), "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80", "North Indian", true),
                new Dish("Veg Biryani with Raita", "Fragrant basmati rice slow-cooked with garden vegetables, saffron, and aromatic whole spices.", new BigDecimal("110.00"), "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80", "North Indian", true),
                new Dish("South Indian Thali", "Full executive meal with 2 rotis, rice, dal tadka, dry veg, sambar, rasam, curd, and papad.", new BigDecimal("100.00"), "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80", "Meals", true),
                new Dish("Crispy Veg Samosa (2 pcs)", "Flaky pastry filled with spiced peas and potatoes, served with tangy tamarind & coriander dip.", new BigDecimal("30.00"), "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80", "Snacks", true),
                new Dish("Veg Grilled Sandwich", "Three-layer grilled bread filled with sliced cucumbers, tomatoes, bell peppers, cheese, and mint chutney.", new BigDecimal("55.00"), "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80", "Snacks", true),
                new Dish("French Fries (Salted)", "Crispy golden potato fries lightly salted, served hot with tomato ketchup.", new BigDecimal("50.00"), "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80", "Snacks", true),
                new Dish("South Indian Filter Coffee", "Traditional strong decoction brewed with fresh milk, frothy and served piping hot in davara-tumbler.", new BigDecimal("25.00"), "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", "Beverages", true),
                new Dish("Masala Chai", "Classic Indian milk tea brewed with crushed ginger, cardamom, cinnamon, and fresh tea leaves.", new BigDecimal("20.00"), "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80", "Beverages", true),
                new Dish("Cold Coffee with Ice Cream", "Chilled creamy blended espresso topped with a scoop of vanilla ice cream and chocolate drizzle.", new BigDecimal("65.00"), "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80", "Beverages", true),
                new Dish("Warm Gulab Jamun (2 pcs)", "Soft milk-solid dumplings soaked in rose and cardamom scented sugar syrup.", new BigDecimal("40.00"), "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80", "Desserts", true),
                new Dish("Chocolate Brownie with Fudge", "Warm decadent chocolate brownie drizzled with rich hot chocolate fudge.", new BigDecimal("70.00"), "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80", "Desserts", false)
            );
            dishRepository.saveAll(initialDishes);
            log.info("Successfully seeded {} menu dishes.", initialDishes.size());
        }
    }
}
