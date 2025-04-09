const headers = {
	"accept": "application/json",
	"user-agent": "Mozilla/5.0",
};
const today = new Date();
const currentDay = today.getDay();

let daysUntilThursday = 4 - currentDay;
if (daysUntilThursday <= 0) {
	daysUntilThursday += 7;
}

const nextThursday = new Date(today);
nextThursday.setDate(today.getDate() + daysUntilThursday);

const day = String(nextThursday.getDate()).padStart(2, '0');
const month = String(nextThursday.getMonth() + 1);
const resDate = day + '-' + month
const url = `https://endpoints.leaflets.schwarz/v4/flyer?flyer_identifier=ab-donnerstag-${resDate}-flugblatt-nat&region_id=0&region_code=0`;

async function getProducts() {
	try {
		const response = await fetch(url, { headers });
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		const pages = data.flyer.pages;
		const products = data.flyer.products;

		const productIds = new Set();
		pages.forEach((page) => {
			page.links.forEach((link) => {
				const title = link.title;
				if (title !== "Link" && title !== "Rezept") {
					productIds.add(link.id);
				}
			});
		});

		const resultArr = [];
		const uniqueNames = new Set();

		productIds.forEach((productId) => {
			const product = products[productId];
			if (product) {
				const { price, title, image, basicPrice } = product;
				if (price !== undefined && title !== undefined && image !== undefined) {
					if (!uniqueNames.has(title)) {
						uniqueNames.add(title);
						resultArr.push({
							price: parseFloat(price),
							name: title,
							img_url: image,
							basicPrice: basicPrice || "" // basicPrice yoksa boş string
						});
					}
				}
			}
		});

		return resultArr;
	} catch (error) {
		console.error("Error:", error);
		return [];
	}
}

let productData = [];
let filteredProducts = [];

function isFoodItem(product) {
	const bp = product.basicPrice.toLowerCase();
	return bp !== "" && !bp.includes("je");
}

function renderProducts(products) {
	const productGrid = document.getElementById('productGrid');
	productGrid.innerHTML = '';

	products.forEach(product => {
		const productCard = document.createElement('div');
		productCard.className = 'product-card';
		productCard.innerHTML = `
			<img src="${product.img_url}" alt="${product.name}">
			<div class="product-info">
				<h3 class="product-name">${product.name}</h3>
				<p class="product-price">€${product.price.toFixed(2)}</p>
				<p class="product-basic">${product.basicPrice}</p>
			</div>
		`;
		productGrid.appendChild(productCard);
	});
}

function sortProducts(key, direction) {
	const sorted = [...filteredProducts].sort((a, b) => {
		if (key === 'price') {
			return direction === 'asc' ? a.price - b.price : b.price - a.price;
		} else {
			return direction === 'asc' 
				? a.name.localeCompare(b.name) 
				: b.name.localeCompare(a.name);
		}
	});
	renderProducts(sorted);
}

function toggleNonFood() {
	const hideNonFood = document.getElementById('hideNonFood').checked;
	if (hideNonFood) {
		filteredProducts = productData.filter(isFoodItem);
	} else {
		filteredProducts = [...productData];
	}
	renderProducts(filteredProducts);
}

getProducts().then(products => {
	productData = products;
	filteredProducts = [...products];
	renderProducts(products);
}).catch(err => {
	console.error(err);
	document.getElementById('productGrid').innerHTML = 'Error loading products';
});
