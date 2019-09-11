var mykey = config.KEY;

// Get title of movie
function getTitle(elem) {
  return $(elem).find(".bob-title").text();
}

// Get either rotten or fresh tomato image
function getRottenTomatoImg(strRating) {
  let rating = parseInt(strRating, 10);
  let img = (rating >= 60) ? "images/fresh32.png" : "images/rotten32.png";
  return chrome.extension.getURL(img);
}

// Get IMDb ID from movie title
function getImdbID(title) {
  return new Promise(function(resolve, reject) {
    fetch("https://movie-database-imdb-alternative.p.rapidapi.com/?page=1&r=json&s=" + title, {
        "method": "GET",
        "headers": {
          "x-rapidapi-host": "movie-database-imdb-alternative.p.rapidapi.com",
          "x-rapidapi-key": mykey
        }
      })
      .then(response => response.json())
      .then(data => {
        resolve(data.Search[0].imdbID);
      })
      .catch(err => {
        console.log(err);
      });
  });
}

// Get movie data - including rating and type (movie or tv series)
function getInfo(id) {
  return new Promise(function(resolve, reject) {
    fetch("https://movie-database-imdb-alternative.p.rapidapi.com/?i=" + id + "&r=json", {
        "method": "GET",
        "headers": {
          "x-rapidapi-host": "movie-database-imdb-alternative.p.rapidapi.com",
          "x-rapidapi-key": mykey
        }
      })
      .then(response => response.json())
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        console.log(err);
      });
  });
}

// Get IMDb URL of movie/tv series
function getImdbUrl(imdbID) {
  let url = "https://www.imdb.com/title/";
  url += imdbID;
  return new URL(url);
}

// Get Metacritic URL of movie/tv series
function getMetacriticUrl(title, type) {
  if (type == "series") {
    type = "tv";
  }

  let url = "https://www.metacritic.com/" + type;
  title = title.replace(/[^\w\s]/gi, '-');
  url += '/' + title;
  return new URL(url);
}

// Append URLs to movie review logos
function appendUrls(title, type, imdbID) {
  let imdbUrl = getImdbUrl(imdbID);
  let metacriticUrl = getMetacriticUrl(title, type);

  $("#imdbIcon").wrap("<a href='" + imdbUrl + "' target='_blank'></a>");
  $("#metacriticIcon").wrap("<a href='" + metacriticUrl + "' target='_blank'></a>");
}

// Add rating logos to movie container
function appendLogo(parent, imgUrl, id) {
  let logo = document.createElement("img");
  logo.src = imgUrl;
  logo.className = "rating-icon";
  logo.setAttribute("id", id);
  parent.appendChild(logo);
}

// Add Rotten Tomatoes rating
function appendRottenTomatoesRating(parent, rating) {
  let ratingElem = document.createElement("span");
  ratingElem.className = "rating-text";
  parent.appendChild(ratingElem);
  ratingElem.innerHTML = rating;
}

// Add IMDb rating
function appendImdbRating(parent, rating) {
  let ratingElem = document.createElement("span");
  ratingElem.className = "rating-text";
  parent.appendChild(ratingElem);
  rating = rating.split('/');   // exclude '/10' from rating
  ratingElem.innerHTML = rating[0];

  let bestRatingElem = document.createElement("span");
  bestRatingElem.className = "best-rating";
  parent.appendChild(bestRatingElem);
  bestRatingElem.innerHTML = "/10";
}

// Add Metacritic rating
function appendMetacriticRating(parent, rating) {
  let ratingElem = document.createElement("span");
  ratingElem.className = "rating-text";
  ratingElem.className += " metacritic";
  rating = rating.split('/');    // exclude '/10' from rating
  parent.appendChild(ratingElem);
  ratingElem.innerHTML = rating[0];

  rating = parseInt(rating, 10);
  if (rating > 60) {
    ratingElem.className += " positive";
  } else if (rating >= 40) {
    ratingElem.className += " mixed";
  } else {
    ratingElem.className += " negative";
  }
}

// Add all ratings to Netflix movie container
function appendRatings(ratings) {
  let ratingContainer = document.createElement("div");
  let imageUrl = "";
  ratingContainer.className = "rating-container";

  if (ratings.length > 0) {
    imageUrl = chrome.extension.getURL("images/IMDb32.png");
    appendLogo(ratingContainer, imageUrl, "imdbIcon");
    appendImdbRating(ratingContainer, ratings[0].Value);
  }
  if (ratings.length > 1) {
    imageUrl = getRottenTomatoImg(ratings[1].Value);
    appendLogo(ratingContainer, imageUrl, "rtIcon");
    appendRottenTomatoesRating(ratingContainer, ratings[1].Value);
  }
  if (ratings.length > 2) {
    imageUrl = chrome.extension.getURL("images/metacritic-logo.png");
    appendLogo(ratingContainer, imageUrl, "metacriticIcon");
    appendMetacriticRating(ratingContainer, ratings[2].Value);
  }
  $("div.bob-play-hitzone").append(ratingContainer);
}

$(document).on("mouseenter", "div.bob-container", function() {
  let title = getTitle(this);

  getImdbID(title)
    .then(imdbID => getInfo(imdbID))
    .then(data => {
      appendRatings(data.Ratings);
      appendUrls(title, data.Type, data.imdbID);
    });
});

$("div.title-card-container").on("mouseleave", "div.bob-container", function() {
  // clean-up
});
