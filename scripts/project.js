class Catalog {
    constructor() {
        this.product_data = [];
        this.load_data_with_fetch();
        this.currency_data = {};
        this.currency = get_cookie("cart-currency"); //NOT SURE ABOUT THIS!!
        this.symbols = { cad: "$", usd: "US$", gbp: "&#163;"};
        if (this.currency == "" || this.currency == undefined || this.currency == null) {
            this.currency == "cad";
        }
    }
    API_URL = "https://fakestoreapi.com/products";
    CURRENCY_API = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cad.json";
    
    load_currency_data() {
        fetch(this.CURRENCY_API).
            then(response => response.json()).
            then((json) => {
                this.currency = json;
                if (this.product_data > 0) {
                    this.currency = "cad";
                    this.render_catalog();
                }
            });
    }
    /* Loads the item data and calls to render_catalog() */
    load_data_with_fetch() {
        fetch(this.API_URL).
            then(response => response.json()).
            then((json) => {
                this.product_data = json;
                this.render_catalog();
            });
    }
    /* renders the items and data on the page */

    render_catalog() {
        for (let product of this.product_data) {
            let { id, title, description, image, price } = product;
            price = parseFloat(price).toFixed(2);
            //let conversion = this.currency_data[`cad`][this.currency]; //add index for usd and gbp
            //price = price * conversion;

            // let symbol = this.symbols[this.currency]; NEED TO FIX THIS
            let card = `<div class="col-sm-6 col-lg-4 mb-4"><div class="card">
					<img src="${image}" alt="${title}">
					<div class="card-body">
						<h5 class="card-title">${title}</h5>
						<p class="card-text">${description}</p>
                        <p class="price">${price}</p>
                        <button class="btn btn-success addToCart" data-id="${id}">Add to Cart</button>
					</div>
				</div>
                </div>`; // need to add ${symbol} before ${price} but not working yet
            document.querySelector(`#catalog`).innerHTML += card;
        }
        let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
        jQuery(catalog_container).imagesLoaded(function () {
            var msnry = new Masonry(catalog_container); // this initializes the masonry container AFTER the product images are loaded
        });

        this.add_event_handlers();
    }

    getItem(product_id) {

        for (let this_product of this.product_data) {
            if (this_product.id == product_id) {
                return this_product;
            }
        }

        if (typeof this.product[product_id] === undefined) {
            return {};
        }
        else {
            return this.product[product_id];
        }
    }

    renderCartItems() {
        let basket = "";
        var basketItems = get_cookie("shopping_cart_items");

        for (let product_id in basketItems) {
            let product = this.getItem(product_id);
            let itemCount = basketItems[product_id];
            let itemSubtotal = product.price * itemCount;
            basket += `<tr><td><button class='btn btn-danger' id='deleteItem'><span class='material-symbols-outlined'>
            delete </span></button><td>${product.title}</td><td>${itemCount}</td><td>${product.price}</td><td>${itemSubtotal}</td></tr>`;
        }
        if (basket!= "") {
            basket = `<table id='table'><tr><th>Item</th><th>Qty</th><th>Price</th><th>Item Subtotal</th></tr>` + basket + `</table>`;
        } else {
            basket = "Your cart is empty.";
        }
        $(`#loadShoppingCart`).html(basket);

        $(`#emptyCart`).click(function() {
            catalog.emptyCart();
            catalog.renderCartItems();
        });

        $(`#deleteItem`).click(function() {
            catalog.deleteFromBasket($(this).attr(`data id`));
            catalog.renderCartItems();
        });

    }

    emptyCart() {
        set_cookie("shopping_cart_items", []);
    }

    deleteFromBasket(product_id) {
        let basketItems = get_cookie("shopping_cart_items");
        delete basketItems[product_id];
        set_cookie("shopping_cart_items", basketItems)
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

    $(this).prepend(`<span class="badge badge-light">` + cart_items[product_id] + `</span>`); // !!!!!!!!!!!!!!!THIS DOESN'T WORK GREAT :/ ADDS MULTIPLE NUMBERS
    set_cookie("shopping_cart_items", cart_items); // setting the cart items back to the cookie storage
});

$(`#viewCart`).click(function() {
    catalog.renderCartItems();
});



}
}
let catalog = new Catalog();
