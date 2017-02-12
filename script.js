
var views = new function(){
	this.productView= null;
};

var endpoint;
var data = [];

function initializeViews(){
	var prototypes = document.getElementById("prototype");
	//console.log(prototypes);
	views.productView = prototypes.getElementsByClassName("productView")[0];
}

function initializeFilters(){
	var filterSelector = document.getElementById("filterSelector");
	for (var i = 0; i <  filters.filter.length; i++) {
		var el = document.createElement("option");
		el.textContent = filters.filter[i].name;
		el.value = i;
		filterSelector.appendChild(el);
	}
}

function instanciatePrototype(protot){
	var div = document.createElement('div');
	div.innerHTML = protot.outerHTML;
	return div.firstChild;
}

function getProductView(product){
	var tmpProductView = instanciatePrototype(views.productView);
	tmpProductView.getElementsByClassName("productNameView")[0].innerHTML = product._source.name_de;
	tmpProductView.getElementsByClassName("productImage")[0].src = product._source.images[0].data.medium.url;
	tmpProductView.getElementsByClassName("showIngredienceView")[0].htmlFor = "showIngredients"+ product._id;
	tmpProductView.getElementsByClassName("showIngredienceCheckBox")[0].id = "showIngredients"+ product._id;
	tmpProductView.getElementsByClassName("productDetailsLink")[0].href = "https://www.openfood.ch/de/products/"+ product._id;
	tmpProductView.getElementsByClassName("productContentView")[0].innerHTML = product._source.ingredients_translations.de;
	var wv =tmpProductView.getElementsByClassName("warningView")[0];
	if (!product.warn){
		tmpProductView.removeChild(wv);
	} else {
		tmpProductView.getElementsByClassName("warnReason")[0].innerHTML = product.reason;
	}
	return tmpProductView;
}

function runScript(e) {
    if (e.keyCode == 13) {
        search();
        return false;
    }
}

function search(){
	var searchString = document.getElementById("search").value
	if (searchString.length > 0){
		var pageNumber = 1;
		addClass(document.getElementsByClassName("search")[0], "busy");
		endpoint.products_search("*" + searchString.toLowerCase() + "*", pageNumber,  function(response) {
			console.log(response);
			data = response.hits.hits;
			updateProductView();
			removeClass(document.getElementsByClassName("search")[0], "busy");
			// Nach dem ersten Suchen den go_search_something ausblenden und den Resultatcount einblenden
			firstSearch();
			
		 });
	} else {
		document.getElementById("display_result").innerHTML = "";
		revertToFirstSearch();
	}
}

function revertToFirstSearch(){
	//Wieder zum urzustand, falls jemand einen leeren Stirng suchen will.
	var searchResultsTitle = document.getElementsByClassName("search-results-title")[0];
	var goSearchSomething = document.getElementsByClassName("go-search-something")[0];
	// To see if this is the first search, check if goSearchSomething is hidden.
	if (hasClass(goSearchSomething, "hidden")){
		addClass(searchResultsTitle, "hidden");
		removeClass(goSearchSomething, "hidden");
	}
}

function firstSearch(){
	var searchResultsTitle = document.getElementsByClassName("search-results-title")[0];
	var goSearchSomething = document.getElementsByClassName("go-search-something")[0];
	// To see if this is the first search, check if searchResultsTitle is hidden.
	if (hasClass(searchResultsTitle, "hidden")){
		removeClass(searchResultsTitle, "hidden");
		addClass(goSearchSomething, "hidden");
	}
}

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function addClass(element, classString){
	element.className += " "+classString;
}

function removeClass(element, classString){
	element.classList.remove(classString);
}

function updateProductView(){
	document.getElementById("display_result").innerHTML = "";
	var showCount = 0;
	for (var i=0;i< data.length;i++){
		var tmpProduct = filterProduct(data[i]);
		if (tmpProduct.show){
			var tpv = getProductView(tmpProduct);
			document.getElementById("display_result").appendChild(tpv);
			showCount++;
		}
	}
	// Anzahl der angezeigten Resultate aktualisieren.
	var searchResultsView = document.getElementsByClassName("search-results-amount")[0];
	searchResultsView.innerHTML = showCount;
}

function filterProduct(product){
	var filterSelector = document.getElementById("filterSelector");
	var selectedFilter = filterSelector.options[filterSelector.selectedIndex].value;
	var currentfilter = null;
	product.show=true;
	product.reason = "";
	product.warn=false;
	product.reason = "";
	if (product._source.ingredients_translations.de != null){
		if (selectedFilter != "default"){
			currentfilter = filters.filter[selectedFilter];
			var ingredients = product._source.ingredients_translations.de.toLowerCase();
			//console.log(ingredients);
			console.log("-------------------");
			for (var i = 0; i <  currentfilter.filter_exclusion.length; i++) {
				var currentSearch = currentfilter.filter_exclusion[i].toLowerCase();
				if (isWordInText(currentSearch, ingredients)){
					product.show = false;
					product.warn = true;
					product.reason += " " +currentfilter.filter_exclusion[i];	// Nicht currentSearch benutzen das dieses Lowercase ist.
				}
			}
			for (var i = 0; i <  currentfilter.filter_warning.length; i++) {
				var currentSearch = currentfilter.filter_warning[i].toLowerCase();
				
				var warnsFound = ingredients.search(currentSearch);
				if (isWordInText(currentSearch, ingredients)){
					product.warn = true;
					product.reason += " " +currentfilter.filter_warning[i];	// Nicht currentSearch benutzen das dieses Lowercase ist.
				}
			}
		}
	} else {
		product.warn=true;
		product.show = false;
		product.reason = "No ingredients information.";
	}

	//console.log(product);
	return product;
}

function isWordInText(searchWord, searchText){
	var result = new RegExp("\\b"+searchWord+"\\b").test(searchText);
	console.log("is " +searchWord + " in " + searchText +"? : " + result);
	return result;
}

$( function() {
	initializeViews();
	initializeFilters();
	var api_key  = "8966508ef4c940c3d05cdbe5b86c6903";
	var host = "https://www.openfood.ch";
	endpoint = new openfoodapi.Endpoint(api_key, host);
	updateProductView();
});