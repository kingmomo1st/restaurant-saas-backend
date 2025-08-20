import { createContext, useContext, useEffect, useState } from "react";

//Create Cart Context

const CartContext= createContext ();

export function CartProvider({children}){
    const [cart, setCart] = useState(()=>{

        try {
            const savedCart= localStorage.getItem("cart");
            return savedCart? JSON.parse(savedCart) : [];
            
        } catch (error) {
            console.error("Error parsing saved cart:", error);
            return [];  
        }
        

})


useEffect(()=>{
    if (cart.length===0) {
        localStorage.removeItem("cart");
    }else{
        localStorage.setItem("cart", JSON.stringify(cart));
    }
}, [cart]);

//Add Item to Cart

const addToCart= (item)=>{
    console.log("Item added to cart:",item)
    setCart((prevCart)=> {
        const existingItem= prevCart.find((i)=> i.id===item.id);
        if(existingItem){
            return prevCart.map((i)=>
                i.id===item.id ? {...i,quantity:i.quantity+1}:i
        );
        }else{
            return[...prevCart,{...item, quantity:item.quantity ||1}];
        }
        
    });
};

//remove Item from cart

const RemoveFromCart= (itemId)=>{
    setCart((prevCart)=> 
        prevCart.map((item)=>
        item.id===itemId? {...item,quantity:item.quantity-1}:item
        )
        .filter((item)=>item.quantity>0)
    );
};

//update Cart

const updateCart= (itemId, newQuantity)=>{
    if(newQuantity <1){
        RemoveFromCart(itemId);
        return
    }
    setCart((prevCart)=>
        prevCart.map((item)=>
        item.id=== itemId ? {...item, quantity: newQuantity}: item
))}



//Clear the cart

const clearCart= ()=>{
    setCart([]);
};


return (
    <CartContext.Provider value={{cart,addToCart,RemoveFromCart,clearCart, updateCart}}>
        {children}
    </CartContext.Provider>
);
}


export function useCart(){
    return useContext(CartContext)
}