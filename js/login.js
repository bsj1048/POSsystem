$(document).ready( function() {
   
    var loginStatus = localStorage.getItem("loginStatus");
    if ( loginStatus ) {
        location.href="/main";
    }

   
    $("input[name=id]").focus();


    
    $("#loginBtn").click( function() {
        var id = $("input[name=id]").val();
        var pw = $("input[name=password]").val();
        
        if ( !id || !pw ) {
            alert("정보를 입력해주세요.");
        }
        else {
            $.ajax({
                url:'/isUser',
                method:'POST',
                data:{
                    "id":id,
                    "pw":pw
                }
            })
            .done(function(response) {
               
                var isUser = parseInt(response.rows[0].count);
                if( !isUser ) {
                    alert("회원정보가 일치하지 않습니다.");
                    $("input[name=password]").val("");
                    $("input[name=id]").focus();

                }
                else {
                    localStorage.setItem("loginStatus",true);
                    localStorage.setItem("userid",id);
                    location.href = "/main"
                }
            })
        }

    });
  
});  
