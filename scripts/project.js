class Catalog {
    function load_data_with_fetch() {
        fetch("https://fakestoreapi.com/products").
            then(response => response.json()).
            then((json) => {
				console.log(json);
            });
        }
}



/* set_cookie("shopping_cart_items", items); // to store data for shopping cart */

/*let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
jQuery(catalog_container).imagesLoaded( function() {
var msnry = new Masonry(catalog_container); // this initializes the masonry container AFTER the product images are loaded
}); THIS GOES IMMEDIATELY AFTER YOU RENDER YOUR CATALOG*/