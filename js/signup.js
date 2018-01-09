$(document).ready( function() {

    $("input[name=id]").focus();

    $("#signupBtn").click( function() {
        var id = $("input[name=id]").val();
        var pw = $("input[name=password]").val();
        var age = $("input[name=age]").val();
        var gender = $("input[name=gender]:checked").val();
        
      
        $.ajax({
            url:'/getTest'
        })
        .done(function(response) {
            console.log(response)
        })
       

    });
  
});  
