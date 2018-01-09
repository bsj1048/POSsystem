$(document).ready( function() {

    $("#chatbotBtn").click(function(){
        location.href = "/chatbot";
    })
    $("#mapBtn").click(function(){
        location.href = "/map";
    })
    $("#logoutBtn").click(function(){
        //localStorage.removeItem("loginStatus");
        localStorage.clear();
        location.href="/login";
    })
});  
