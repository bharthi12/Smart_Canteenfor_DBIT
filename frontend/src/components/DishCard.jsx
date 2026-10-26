import React from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Minus, ShoppingBag, Ban } from 'lucide-react';

export function DishCard({ dish }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantityInCart = getItemQuantity(dish.id);

  const priceFormatted = Number(dish.price).toFixed(2);

  return (
    <article className="dish-card" id={`dish-${dish.id}`}>
      <div className="dish-image-wrapper">
        <img
          src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
          alt={dish.name}
          className="dish-image"
          loading="lazy"
        />
        <span className="dish-category-badge">{dish.category}</span>

        {!dish.available && (
          <div className="dish-sold-out-overlay">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Ban size={20} /> Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="dish-body">
        <h3 className="dish-title">{dish.name}</h3>
        <p className="dish-desc">{dish.description}</p>

        <div className="dish-footer">
          <div className="dish-price">
            <span>₹</span>{priceFormatted}
          </div>

          <div>
            {!dish.available ? (
              <button className="btn btn-outline btn-sm" disabled>
                Sold Out
              </button>
            ) : quantityInCart > 0 ? (
              <div className="qty-selector">
                <button
                  onClick={() => updateQuantity(dish.id, quantityInCart - 1)}
                  className="qty-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-display">{quantityInCart}</span>
                <button
                  onClick={() => updateQuantity(dish.id, quantityInCart + 1)}
                  className="qty-btn"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(dish, 1)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
