import React from "react";
import "./css/showcase.css"

const menus= [

    {
        title:"Dinner Menu",
        description: "Seasonal Italian dishes crafted with love and tradition.",
        link: "/menu",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1000&q=80",

    },

    {
        title:"Wine List",
        description: "Explore our curated selection of Italian reds and whites.",
        link: "/menu",
        image: "https://images.unsplash.com/photo-1510626176961-4bfb7f9ada7b?auto=format&fit=crop&w=1000&q=80",

    },


    {
        title:"Dessert Menu",
        description: "Traditional sweet treats to end your meal beautifully.",
        link: "/menu",
        image: 'https://images.unsplash.com/photo-1604152135912-04a6729d4d38?auto=format&fit=crop&w=1000&q=80',

    },

]

const ShowcaseMenuSection= ()=>{
    return(
        <section className="showcase-section">
            <h2 className="showcase-heading"> Discover our Menus</h2>
            <div className="showcase-grid">
                {menus.map((menu,index)=>(
                    <div className="showcase-card" key={index}>
                        <img src={menu.image} alt={menu.title} className="showcase-img"/>
                        <h3> {menu.title}</h3>
                        <p>{menu.description}</p>
                        <a href={menu.link} className="btn btn-outline"> View {menu.title}</a>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ShowcaseMenuSection