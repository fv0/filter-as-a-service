var PAGESIZE = 20;
var SELECTEDFILTER = 0;	// Glutenfilter: 0, Kein filter: "default"
//var SELECTEDFILTER = "default";

var views = new function(){
	this.productView= null;
};

var endpoint;
var resultdata = {};

function initializeViews(){
	var prototypes = document.getElementById("prototype");
	views.productView = prototypes.getElementsByClassName("productView")[0];
}

function instanciatePrototype(protot){
	var div = document.createElement('div');
	div.innerHTML = protot.outerHTML;
	return div.firstChild;
}

function getProductView(product){
	var tmpProductView = instanciatePrototype(views.productView);
	tmpProductView.getElementsByClassName("productDetailsLink")[0].innerHTML = product._source.name_de;
	tmpProductView.getElementsByClassName("productDetailsLink")[0].href = "https://www.openfood.ch/de/products/"+ product._id;
	tmpProductView.getElementsByClassName("productImage")[0].src = product._source.images[Math.floor(Math.random()* product._source.images.length)].data.medium.url;
	tmpProductView.getElementsByClassName("showIngredienceView")[0].htmlFor = "showIngredients"+ product._id;
	tmpProductView.getElementsByClassName("showIngredienceCheckBox")[0].id = "showIngredients"+ product._id;
	tmpProductView.getElementsByClassName("productContentView")[0].innerHTML = product._source.ingredients_translations.de;
	var wv =tmpProductView.getElementsByClassName("warningView")[0];
	if (!product.highlight){
		tmpProductView.removeChild(wv);
	} else {
		tmpProductView.getElementsByClassName("warnReason")[0].innerHTML = product.highlight["ingredients_translations.de"][0];
	}
	return tmpProductView;
}

function runScript(e) {
    if (e.keyCode == 13) {
        UIsearch();
        return false;
    }
}

function UIsearch(){search(document.getElementById("search").value);}

function submitfeedbackform(){
	var feedbackform = document.getElementById("feedbackform");
	/*
	var action = "https://formspree.io/xxx";
	var ascii= action.split('').map(function(itm){
		return itm.charCodeAt(0);
	});
	console.log(ascii);
	*/

	var asciion = [104, 116, 116, 112, 115, 58, 47, 47, 102, 111, 114, 109, 115, 112, 114, 101, 101, 46, 105, 111, 47, 105, 110, 102, 111, 64, 103, 108, 117, 116, 101, 110, 99, 104, 101, 99, 107, 101, 114, 46, 99, 104];
	var action = asciion.map(function(itm, i){
		return String.fromCharCode(itm);
	}).join('');

	feedbackform.action = action;
	feedbackform.submit();
	feedbackform.action = "";

}
function sendTextToFeedbackForm(text){
	var feedbackformmessage = document.getElementById("feedbackformmessage");
	feedbackformmessage.value=text;
}


function firstpage(){
	ga('send', 'event', 'search', 'changePage', 'FirstPage');
	if(resultdata.searchString) {
		gotopage(1);
	}
}
function nextpage(){
	ga('send', 'event', 'search', 'changePage', 'NextPage');
	if(resultdata.hits.page ) {
		gotopage(resultdata.hits.page+1);
	}
}
function previouspage(){
	ga('send', 'event', 'search', 'changePage', 'PreviousPage');
	if(resultdata.hits.page ) {
		gotopage(resultdata.hits.page-1);
	}
}

function gotopage(page){
	ga('send', 'event', 'search', 'gotoPage', page);
	if(resultdata.searchString) {
		search(resultdata.searchString, validatePage(page));
	}
}

// Gibt die nächste gültige Seite  zu page zurück (1 für negative,)
function validatePage(page){
	var result = 0;
	if(resultdata.hits && resultdata.hits.pagesize && resultdata.hits.total) {
		if  (page <1){
			result =1;
		}else if ((page-1) * resultdata.hits.pagesize < resultdata.hits.total){
			result = page;
		} else {
			result = Math.ceil(resultdata.hits.total / resultdata.hits.pagesize);
		}
	}
	return result;
}

function search(searchString, pageNumber){
	// Google Tracking
	ga('send', 'event', 'search', 'search', searchString);

	if (searchString.length > 0){
		if (typeof(pageNumber) == 'undefined'){
			pageNumber = 1;
		}
		addClass(document.getElementsByClassName("search")[0], "busy");
		var esDSLquery = getFilterQuery(searchString, PAGESIZE, pageNumber);
		endpoint.products_search(esDSLquery,  function(response) {
			response.hits.page = pageNumber;
			response.hits.pagesize = PAGESIZE;
			resultdata = response;
			resultdata.searchString = searchString;
			updateProductView();
			removeClass(document.getElementsByClassName("search")[0], "busy");
			// Nach dem ersten Suchen den go_search_something ausblenden und den Resultatcount einblenden
			firstSearch();

		 });
	} else {
		document.getElementById("display_result").innerHTML = "";
		revertToFirstSearch();
		updateProductView();
	}
}

function firstSearch(){
	var searchResultsTitle = document.getElementsByClassName("search-results-title")[0];
	var goSearchSomething = document.getElementsByClassName("go-search-something")[0];
	var resultsFromTo = document.getElementsByClassName("results-from-to")[0];
	// To see if this is the first search, check if searchResultsTitle is hidden.
	if (hasClass(searchResultsTitle, "hidden")){
		removeClass(searchResultsTitle, "hidden");
		//removeClass(resultsFromTo, "hidden");
		addClass(goSearchSomething, "hidden");
	}
}

function revertToFirstSearch(){
	//Wieder zum urzustand, falls jemand einen leeren Stirng suchen will.
	var searchResultsTitle = document.getElementsByClassName("search-results-title")[0];
	var goSearchSomething = document.getElementsByClassName("go-search-something")[0];
	var resultsFromTo = document.getElementsByClassName("results-from-to")[0];
	// To see if this is the first search, check if goSearchSomething is hidden.
	if (hasClass(goSearchSomething, "hidden")){
		addClass(searchResultsTitle, "hidden");
		addClass(resultsFromTo, "hidden");
		removeClass(goSearchSomething, "hidden");
	}
	resultdata = {};
}

function updateProductView(){
	document.getElementById("display_result").innerHTML = "";
	if(resultdata.hits && resultdata.hits.hits) {
		for (var i=0;i< resultdata.hits.hits.length;i++){
			var tmpProduct = resultdata.hits.hits[i];
			var tpv = getProductView(tmpProduct);
			document.getElementById("display_result").appendChild(tpv);
		}
		// Anzahl der angezeigten Resultate aktualisieren.
		var searchResultsView = document.getElementsByClassName("search-results-amount")[0];
	searchResultsView.innerHTML = resultdata.hits.total;
	}
	updateNavigationControls();
}

function updateNavigationControls(){
	var resultsFirstPage = document.getElementById("link-results-firstpage");
	var resultsNextPage = document.getElementById("link-results-nextpage");
	var resultsPreviousPage = document.getElementById("link-results-previouspage");
	if(resultdata.hits && resultdata.hits.pagesize && resultdata.hits.total &&  resultdata.hits.page) {
		if(validatePage(2)==2) { // Mindestens 2 Seiten!
			removeClass(resultsFirstPage, "hidden");
		} else {
			addClass(resultsFirstPage, "hidden");
		}
		if(validatePage(resultdata.hits.page+1)==(resultdata.hits.page+1)) {
			removeClass(resultsNextPage, "hidden");
		} else {
			addClass(resultsNextPage, "hidden");
		}
		if(validatePage(resultdata.hits.page-1)==(resultdata.hits.page-1)) {
			removeClass(resultsPreviousPage, "hidden");
		} else {
			addClass(resultsPreviousPage, "hidden");
		}
	} else {
		addClass(resultsFirstPage, "hidden");
		addClass(resultsNextPage, "hidden");
		addClass(resultsPreviousPage, "hidden");
	}
}

function updateFilterInfo(){
	var jsfiltersexclusion = document.getElementsByClassName("js-filters-exclusion")[0];
	var jsfilterswarning = document.getElementsByClassName("js-filters-warning")[0];
	var currentfilter = filters.filter[SELECTEDFILTER];
	// Add filter_exclusion Terms
	var connector = "";
	for (var i = 0; i <  currentfilter.filter_exclusion.length; i++) {
		var term = currentfilter.filter_exclusion[i];
		jsfiltersexclusion.innerHTML+= connector+term;
		connector= ", ";
	}
	// Add filter_warning Terms
	connector = "";
	for (var i = 0; i <  currentfilter.filter_warning.length; i++) {
		var term = currentfilter.filter_warning[i];
		jsfilterswarning.innerHTML+= connector+term;
		connector= ", ";
	}
}

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function addClass(element, classString){
	removeClass(element, classString);
	element.className += " "+classString;
}

function removeClass(element, classString){
	element.classList.remove(classString);
}

function getFilterQuery(terms, pageSize, pageNumber){
	terms = terms.toLowerCase();
	var selectedFilter = SELECTEDFILTER;	// Glutenfilter
	var esDSLquery = {"_source":true,
		"from" : pageSize*(pageNumber-1),
		"size" : pageSize,
		"query":{
			"bool": {
				"must": {
					"simple_query_string":{
						"query": terms
					}
				},
				"must_not":
					{"bool": {
						"must_not": {"bool": {"must_not": []}},// filter_exclusion
						"filter": {"bool": {"must_not": []}}// filter_inclusion
					}
				},
				"filter": {
					"exists": {
						"field": "ingredients_translations.de"	// Produlkte ohne Ingredients ausschliessen
					}
				}
			}
		},
		"highlight" : {
			"fields" : {
				"ingredients_translations.de": {
					"highlight_query": {
						"bool": {
							"must": []	// filter_warning
						}
					}
				}
			}
		},
		"sort":["_score"]
	};
	//console.log(esDSLquery);
	if (selectedFilter != "default"){
		var currentfilter = filters.filter[selectedFilter];
		// Add filter_exclusion Terms
		for (var i = 0; i <  currentfilter.filter_exclusion.length; i++) {
			var term = currentfilter.filter_exclusion[i].toLowerCase();
			var filterTerm = {
				"match_phrase": {
					"ingredients_translations.de": term
				}
			};
			esDSLquery.query.bool.must_not.bool.must_not.bool.must_not.push(filterTerm);
		}

		// Add filter_inclusion Terms

		for (var i = 0; i <  currentfilter.filter_inclusion.length; i++) {
			var term = currentfilter.filter_inclusion[i].toLowerCase();
			var filterTerm = {
				"match_phrase": {
					"ingredients_translations.de": term
				}
			};
			esDSLquery.query.bool.must_not.bool.filter.bool.must_not.push(filterTerm);
		}

		// Add filter_warning Terms
		for (var i = 0; i <  currentfilter.filter_warning.length; i++) {
			var term = currentfilter.filter_warning[i].toLowerCase();
			var filterTerm = {
				"match_phrase": {
					"ingredients_translations.de": term
				}
			};
			esDSLquery.highlight.fields["ingredients_translations.de"].highlight_query.bool.must.push(filterTerm);
		}
	}
	return  esDSLquery;
}


$( function() {
	initializeViews();
	updateFilterInfo();
	var api_key  = "8966508ef4c940c3d05cdbe5b86c6903";
	var host = "https://www.openfood.ch";
	endpoint = new openfoodapi.Endpoint(api_key, host);
	updateProductView();
});
