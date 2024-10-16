

$(function() {
    // Hide the collapsible navbar when it loses focus on small screens
    $("#navbarToggle").blur(function(event) {
        if (window.innerWidth < 768) {
            $("#collapsable-nav").collapse('hide');
        }
    });
});

(function(global) {
    var dc = {};

    // URLs for various snippets and API endpoints
    var homeHtmlUrl = "snippets/home-snippet.html";
    var allCategoriesUrl = "https://davids-restaurant.herokuapp.com/categories.json";
    var categoriesTitleHtml = "snippets/categories-title-snippet.html";
    var categoryHtml = "snippets/category-snippet.html";
    var menuItemsUrl = "https://davids-restaurant.herokuapp.com/menu_items.json?category=";
    var menuItemsTitleHtml = "snippets/menu-items-title.html";
    var menuItemHtml = "snippets/menu-item.html";

    // Convenience function for inserting innerHTML for 'select'
    var insertHtml = function(selector, html) {
        var targetElem = document.querySelector(selector);
        targetElem.innerHTML = html;
    };

    // Show loading icon inside element identified by 'selector'
    var showLoading = function(selector) {
        var html = "<div class='text-center'><img src='images/ajax-loader.gif'></div>";
        insertHtml(selector, html);

        // Hide the loading GIF after 2 seconds
        var loadingTimeout = setTimeout(function() {
            insertHtml(selector, ""); // Clear the loading GIF
        }, 2000);

        // Return a function to clear the timeout and hide the GIF if loading is done early
        return function() {
            clearTimeout(loadingTimeout);
            insertHtml(selector, ""); // Clear the loading GIF
        };
    };

    // Return substitute of '{{propName}}' with propValue in given 'string'
    var insertProperty = function(string, propName, propValue) {
        var propToReplace = "{{" + propName + "}}";
        return string.replace(new RegExp(propToReplace, "g"), propValue);
    };

    // Remove 'active' class from home and switch to Menu button
    var switchMenuToActive = function() {
        var homeButton = document.querySelector("#navHomeButton");
        var menuButton = document.querySelector("#navMenuButton");
        
        // Remove 'active' from home button
        homeButton.classList.remove("active");
        
        // Add 'active' to menu button
        menuButton.classList.add("active");
    };

    // On page load
    document.addEventListener("DOMContentLoaded", function(event) {
        var hideLoading = showLoading("#main-content");
        $ajaxUtils.sendGetRequest(
            allCategoriesUrl,
            function(categories) {
                hideLoading(); // Hide loading GIF immediately after data is received
                buildAndShowHomeHTML(categories);
            },
            true
        );
    });

    // Builds HTML for the home page based on categories array
    function buildAndShowHomeHTML(categories) {
        $ajaxUtils.sendGetRequest(homeHtmlUrl, function(homeHtml) {
            // Choose a random category
            var chosenCategoryShortName = chooseRandomCategory(categories).short_name;
            
            // Insert the chosen category into the home HTML snippet
            var homeHtmlToInsertIntoMainPage = insertProperty(homeHtml, "randomCategoryShortName", "'" + chosenCategoryShortName + "'");
            insertHtml("#main-content", homeHtmlToInsertIntoMainPage);
        }, false);
    }

    // Given array of category objects, returns a random category object
    function chooseRandomCategory(categories) {
        var randomIndex = Math.floor(Math.random() * categories.length);
        return categories[randomIndex];
    }

    // Load the menu categories view
    dc.loadMenuCategories = function() {
        var hideLoading = showLoading("#main-content");
        $ajaxUtils.sendGetRequest(allCategoriesUrl, function(categories) {
            hideLoading(); // Hide loading GIF immediately after data is received
            buildAndShowCategoriesHTML(categories);
        });
    };

    // Load the menu items view
    dc.loadMenuItems = function(categoryShort) {
        var hideLoading = showLoading("#main-content");
        $ajaxUtils.sendGetRequest(menuItemsUrl + categoryShort, function(categoryMenuItems) {
            hideLoading(); // Hide loading GIF immediately after data is received
            buildAndShowMenuItemsHTML(categoryMenuItems);
        });
    };

    // Builds HTML for the categories page based on the data from the server
    function buildAndShowCategoriesHTML(categories) {
        $ajaxUtils.sendGetRequest(categoriesTitleHtml, function(categoriesTitleHtml) {
            $ajaxUtils.sendGetRequest(categoryHtml, function(categoryHtml) {
                switchMenuToActive();
                var categoriesViewHtml = buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml);
                insertHtml("#main-content", categoriesViewHtml);
            }, false);
        }, false);
    }

    // Build categories view HTML to be inserted into page
    function buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml) {
        var finalHtml = categoriesTitleHtml + "<section class='row'>";
        categories.forEach(function(category) {
            var html = insertProperty(categoryHtml, "name", category.name);
            html = insertProperty(html, "short_name", category.short_name);
            finalHtml += html;
        });
        finalHtml += "</section>";
        return finalHtml;
    }

    // Builds HTML for the single category page based on the data from the server
    function buildAndShowMenuItemsHTML(categoryMenuItems) {
        $ajaxUtils.sendGetRequest(menuItemsTitleHtml, function(menuItemsTitleHtml) {
            $ajaxUtils.sendGetRequest(menuItemHtml, function(menuItemHtml) {
                switchMenuToActive();
                var menuItemsViewHtml = buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml);
                insertHtml("#main-content", menuItemsViewHtml);
            }, false);
        }, false);
    }

    // Build menu items view HTML to be inserted into page
    function buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml) {
        menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "name", categoryMenuItems.category.name);
        menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "special_instructions", categoryMenuItems.category.special_instructions);

        var finalHtml = menuItemsTitleHtml + "<section class='row'>";
        var menuItems = categoryMenuItems.menu_items;
        var catShortName = categoryMenuItems.category.short_name;
        
        menuItems.forEach(function(item, i) {
            var html = menuItemHtml;
            html = insertProperty(html, "short_name", item.short_name);
            html = insertProperty(html, "catShortName", catShortName);
            html = insertItemPrice(html, "price_small", item.price_small);
            html = insertItemPortionName(html, "small_portion_name", item.small_portion_name);
            html = insertItemPrice(html, "price_large", item.price_large);
            html = insertItemPortionName(html, "large_portion_name", item.large_portion_name);
            html = insertProperty(html, "name", item.name);
            html = insertProperty(html, "description", item.description);

            // Add clearfix after every second menu item
            if (i % 2 !== 0) {
                html += "<div class='clearfix visible-lg-block visible-md-block'></div>";
            }

            finalHtml += html;
        });

        finalHtml += "</section>";
        return finalHtml;
    }

    // Appends price with '$' if price exists
    function insertItemPrice(html, pricePropName, priceValue) {
        if (!priceValue) return insertProperty(html, pricePropName, "");
        priceValue = "$" + priceValue.toFixed(2);
        return insertProperty(html, pricePropName, priceValue);
    }

    // Appends portion name in parens if it exists
    function insertItemPortionName(html, portionPropName, portionValue) {
        if (!portionValue) return insertProperty(html, portionPropName, "");
        portionValue = "(" + portionValue + ")";
        return insertProperty(html, portionPropName, portionValue);
    }

    global.$dc = dc;
})(window);
(function(global) {
    var dc = {};

    // URLs for various snippets and API endpoints
    var allCategoriesUrl = "https://davids-restaurant.herokuapp.com/categories.json";
    var menuItemsUrl = "https://davids-restaurant.herokuapp.com/menu_items.json?category=";
    var menuItemsTitleHtml = "snippets/menu-items-title.html";
    var menuItemHtml = "snippets/menu-item.html";

    // Convenience function for inserting innerHTML for 'select'
    var insertHtml = function(selector, html) {
        var targetElem = document.querySelector(selector);
        targetElem.innerHTML = html;
    };

    // Show loading icon inside element identified by 'selector'
    var showLoading = function(selector) {
        var html = "<div class='text-center'><img src='images/ajax-loader.gif'></div>";
        insertHtml(selector, html);
    };

    // Load the menu items view
    dc.loadMenuItems = function(categoryShort) {
        showLoading("#main-content");
        $ajaxUtils.sendGetRequest(menuItemsUrl + categoryShort, buildAndShowMenuItemsHTML);
    };

    // Builds HTML for the single category page based on the data from the server
    function buildAndShowMenuItemsHTML(categoryMenuItems) {
        $ajaxUtils.sendGetRequest(menuItemsTitleHtml, function(menuItemsTitleHtml) {
            $ajaxUtils.sendGetRequest(menuItemHtml, function(menuItemHtml) {
                var menuItemsViewHtml = buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml);
                insertHtml("#main-content", menuItemsViewHtml);
            }, false);
        }, false);
    }

    // Build menu items view HTML to be inserted into page
    function buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml) {
        // Build title
        menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "name", categoryMenuItems.category.name);
        
        var finalHtml = menuItemsTitleHtml + "<section class='row'>";
        var menuItems = categoryMenuItems.menu_items;

        // Loop through the menu items and build HTML
        menuItems.forEach(function(item) {
            var html = menuItemHtml;
            html = insertProperty(html, "short_name", item.short_name);
            html = insertProperty(html, "name", item.name);
            html = insertProperty(html, "description", item.description);
            html = insertItemPrice(html, "price_small", item.price_small);
            html = insertItemPrice(html, "price_large", item.price_large);
            html = insertItemPortionName(html, "small_portion_name", item.small_portion_name);
            html = insertItemPortionName(html, "large_portion_name", item.large_portion_name);
            finalHtml += html;
        });

        finalHtml += "</section>";
        return finalHtml;
    }

    // Helper function to replace properties in the template
    function insertProperty(string, propName, propValue) {
        var propToReplace = "{{" + propName + "}}";
        return string.replace(new RegExp(propToReplace, "g"), propValue);
    }

    // Append price with '$' if price exists
    function insertItemPrice(html, pricePropName, priceValue) {
        if (!priceValue) return insertProperty(html, pricePropName, "");
        priceValue = "$" + priceValue.toFixed(2);
        return insertProperty(html, pricePropName, priceValue);
    }

    // Append portion name in parens if it exists
    function insertItemPortionName(html, portionPropName, portionValue) {
        if (!portionValue) return insertProperty(html, portionPropName, "");
        portionValue = "(" + portionValue + ")";
        return insertProperty(html, portionPropName, portionValue);
    }

    global.$dc = dc;

})(window);
