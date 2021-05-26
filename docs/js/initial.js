function openPage(pageName,elmnt) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = '#2b4f60';
}

window.addEventListener("resize", function(event) {
    width = document.body.clientWidth;
    console.log(document.body.clientWidth + ' wide by ');
    updateView(width);
})

function updateView(width) {
    var forms = document.getElementsByClassName("form-div");
    var connects = document.getElementsByClassName("connected");
    if(width < 700) {
        for(var i=0; i<forms.length; i++) {
            forms[i].style.margin = "0% 0%";
        }

        for(var i=0; i<connects.length; i++) {
            connects[i].style.margin = "0% 0%";
        }
    } else {
        for(var i=0; i<forms.length; i++) {
            forms[i].style.margin = "0% 25%";
        }

        for(var i=0; i<connects.length; i++) {
            connects[i].style.margin = "0% 25%";
        }
    }
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("submit-tab").click();

updateView(document.body.clientWidth);