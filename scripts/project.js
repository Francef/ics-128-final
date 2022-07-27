class Catalog {
    constructor() {
        this.product_data = [];
        this.load_data_with_fetch();
    }
    API_URL = "https://fakestoreapi.com/products";
    load_data_with_fetch() {
        fetch(this.API_URL).
            then(response => response.json()).
            then((json) => {
                this.product_data = json;
                this.render_catalog();
            });
    }
    render_catalog() {
        for (let i = 0; i < this.product_data.length; i++) {
            let price = this.product_data[i].price;
            price = parseFloat(price).toFixed(2);
            let card = `<div class="col-sm-6 col-lg-4 mb-4"><div class="card">
					<img src="` + this.product_data[i].image +`" alt="` + this.product_data[i].title + `">
					<div class="card-body">
						<h5 class="card-title">`+ this.product_data[i].title + `</h5>
                        <p class="card-text">` + price + `</p>
						<p class="card-text">` + this.product_data[i].description + `</p>
                        <button class="addToCart" data-id="` + this.product_data[i].id + `">Add to Cart</button>
					</div>
				</div>
                </div>`;
            document.querySelector(`#catalog`).innerHTML += card;
        }
        let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
        jQuery(catalog_container).imagesLoaded(function () {
            var msnry = new Masonry(catalog_container); // this initializes the masonry container AFTER the product images are loaded
        });

        this.add_event_handlers();
    }

add_event_handlers() {

 //let data = get_cookie("shopping_cart_items");

 $(".addToCart").click(function() {
    //get the product id that had its "add to cart" button clicked
    var product_id = $(this).attr("data-id");
    var cart_items = get_cookie("shopping_cart_items"); // get the data stored as a cookie

    // initialize the cart items if it returns null
    if (cart_items === null) {
        cart_items = {};
    }

    // make sure object is defined
    if (cart_items[product_id] === undefined) {
        cart_items[product_id] = 0;
    }

    cart_items[product_id]++;
    console.log(cart_items); //TAKE THIS OUT LATER!!!!!!!!!!!!!!!!!!!!!!!
    $(this).prepend(`<span class="badge badge-light">` + cart_items[product_id] + `</span>`); // !!!!!!!!!!!!!!!THIS DOESN'T WORK GREAT :/ ADDS MULTIPLE NUMBERS
    set_cookie("shopping_cart_items", cart_items); // setting the cart items back to the cookie storage
});
}
}
let catalog = new Catalog();
