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
            let card = `<div class="col-sm-6 col-lg-4 mb-4"><div class="card">
					<svg class="bd-placeholder-img card-img-top" width="100%" height="200"
						xmlns="` + this.product_data[i].image + `" role="img" aria-label="Placeholder: Image cap"
						preserveAspectRatio="xMidYMid slice" focusable="false">
						<title>Placeholder</title>
						<rect width="100%" height="100%" fill="#868e96" /><text x="50%" y="50%" fill="#dee2e6"
							dy=".3em">Image cap</text>
					</svg>
					<div class="card-body">
						<h5 class="card-title">`+ this.product_data[i].title + `</h5>
                        <p class="card-text">` + this.product_data[i].price + `</p>
						<p class="card-text">` + this.product_data[i].description + `</p>
					</div>
				</div></div>`;
            document.querySelector(`#catalog`).innerHTML += card;
        }
        let catalog_container = document.getElementById("catalog"); // assuming your target is <div class='row' id='catalog'>
        jQuery(catalog_container).imagesLoaded(function () {
            var msnry = new Masonry(catalog_container); // this initializes the masonry container AFTER the product images are loaded
        });
    }
}

let catalog = new Catalog();



/* set_cookie("shopping_cart_items", items); // to store data for shopping cart */
