import React, {useEffect, useRef, useState} from "react";
import "./css/OrderOnline.css";
import {Link, useLocation} from "react-router-dom";
import {collection, getDocs} from "firebase/firestore"
import { firestore } from "../firebase";
import {useSelector, useDispatch} from "react-redux";
import {addToCart as addToCartAction} from "../redux/cartSlice"
import { setCategory } from "../redux/categoryFilterSlice";


const PizzaOptions= ({item})=>{
    const dispatch= useDispatch();
    const [selectedSize, setSelectedSize]= useState(item.sizes?.[0]?.name || "");

    const getSelectedSizeData= ()=>
        item.sizes?.find(size=>size.name===selectedSize);

    const handleAddToCart= ()=>{
        const sizeData= getSelectedSizeData();
        if(!sizeData) return;

        dispatch(addToCartAction ({
            id: item.id + "_" + sizeData.name,
            name: `${item.name} (${sizeData.name})`,
            price: sizeData.price,
            quantity:1
        }));
    }

    return (
        <div className="pizza-options"> ✅
            <select value={selectedSize} onChange={(e)=> setSelectedSize(e.target.value)}>
                {item.sizes?.map((size,index)=>(
                    <option key={index} value={size.name}>
                        {size.name.charAt(0).toUpperCase()+ size.name.slice(1)} - ${size.price}
                    </option>
                ))}
            </select>
            <button onClick={handleAddToCart}>Add to Cart</button>
        </div>
    );
};


const OrderOnline= () => {
    const location= useLocation();
    const queryParams= new URLSearchParams(location.search);
    const initialCategory= queryParams.get("category");
    

    const sectionRefs= {
        pizza: useRef(null),
        wines: useRef(null),
        desserts: useRef(null),
        pasta: useRef(null),
        appetizers: useRef(null)
    };

    const cart= useSelector((state)=>state.cart.items);
    const dispatch= useDispatch();
    const [menuItems,setMenuItems]= useState([]);
    const [loading,setLoading]=useState(true);
    const selectedCategory= useSelector((state)=> state.categoryFilter.selectedCategory);


    useEffect(()=>{
        const fetchMenu= async ()=>{
            try{
                const menuSnapshot= await getDocs(collection(firestore,"MenuItems"));
                const items= menuSnapshot.docs.map(doc=>({
                    id:doc.id,
                    ...doc.data()
                }));
                setMenuItems(items);
            }catch (error){
                console.error("Failed to fetch menu")
            }finally{
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    useEffect(()=>{
        if(initialCategory && sectionRefs[initialCategory.toLowerCase()]){
            dispatch(setCategory(initialCategory.toLowerCase()));
            sectionRefs[initialCategory.toLowerCase()].current?.scrollIntoView({
                behavior:"smooth"
            });
        }
    },[initialCategory,menuItems]);


    const filteredItems= selectedCategory
    ? menuItems.filter(item=>item.category?.toLowerCase()===selectedCategory.toLowerCase())
    : menuItems;

    if(loading){
        return (
            <div className="loading">
                {[...Array(6)].map((_,i)=>(
                    <div key={i} className="skeleton-item"></div>
                ))}
            </div>
        );}

            return (
                <div className="order-online-container">
                    <div className="order-online-header">
                        <h1>Order Online</h1>
                        <p> Enjoy the best Italian food from the comfort of your home.</p>
                        </div>

                <div className="order-online-categories">
                {Object.keys(sectionRefs).map(key=>(
                <button
                    key={key}
                    onClick={()=> dispatch(setCategory(key))}
                    className={selectedCategory?.toLowerCase()===key.toLowerCase()? "active":""}
                >
                    {key.charAt(0).toUpperCase()+ key.slice(1)}
                </button>
            ))}
        </div>

        <div className="menu-items-container">
            {filteredItems.map(item=>(
                <div key={item.id} className="menu-item">
                <img
                    src={item.imageURL || "https://via.placeholder.com/150"}
                    alt={item.name ||"Menu item"}
                    className="menu-image"
                    />
                    <h3> {item.name}</h3>
                    <p>{item.description}</p>
                    {item.category.toLowerCase() === "pizza" ? (
                    <PizzaOptions item={item} />
                    ) : item.category.toLowerCase() === "wines" ? (
                    <>
                    <button onClick={() => dispatch(addToCartAction({
                        id: item.id + "_glass",
                        name: `${item.name} (glass)`,
                        price: item.priceGlass,
                        quantity: 1
                        }))}>
                        Glass - ${item.priceGlass}
                        </button>
                        <button onClick={() => dispatch(addToCartAction({
                            id: item.id + "_bottle",
                            name: `${item.name} (bottle)`,
                            price: item.priceBottle,
                            quantity: 1
                        }))}>
                        Bottle - ${item.priceBottle}
                        </button>
                        </>
                         ) : (
                        <>
                        <p>${item.price}</p>
                        <button onClick={() => dispatch(addToCartAction({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1
                        }))}>
                            Add to Cart
                        </button>
                        </>
                        )}
                    </div>

                        ))}
                    </div>
       
            <div className="cart-summary">
                <h2> Your Cart</h2>
                {cart.length ===0 ? (
                    <p> Your Cart is empty.</p>
                ): (
                    <div>
                        <ul>
                            {cart.map((item,index)=>(
                                <li key={item.id}>
                                    {item.name} - {item.quantity} x ${item.price.toFixed(2)}= ${(item.price * item.quantity).toFixed(2)}
                                </li>
                            ))}
                        </ul>
                        <div className="total">
                            <strong> Total: ${cart.reduce((acc,item) => acc +item.price *item.quantity,0).toFixed(2)}</strong>
                        </div>
                        <Link to="/checkout">
                            <button className="checkout-btn">Checkout</button>
                        </Link>
                       
                    </div>
                )}
            </div>

            <div className="back-btn">
                <Link to="/" className="back-link"> Back to Menu</Link>
            </div>
        </div>
    );
}


export default OrderOnline;