(function($){
  $(function(){

    var userAgent = window.navigator.userAgent.toLowerCase(),
        safari = /safari/.test(userAgent),
        ios = /iphone|ipod|ipad/.test(userAgent);

    if( ios ) {
      if ( !safari ) { // webview
        var host = window.location.host;
        window.location.href = "https://" + host + "/ios-help";
      };
    }

  }); // end of document ready
})(jQuery); // end of jQuery name space
