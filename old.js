
<script>

 {/* Notification!  */}

 function showNotification(title, content) {
       
               const titleNote = title;
               const bodyNote = content;
               const notification = new Notification(titleNote, {
                 body: bodyNote,
                 icon: "/css/images/notificationIcon.jpg",
             });

             notification.onclick = (e) => {
               window.location.href = "https://localhost:3000/notes#";
             };
         
         };

         function alarm(time) {
               const noteAlarm = time;
               // Create new Date using the data from database.
               let setAlarm = new Date(noteAlarm);
               // Compare the current date - date from database
               let alarmPlay = new Date(setAlarm) - new Date();
               // Set the time out based on current date - date from database and display notification.
               setTimeout(function () {
                 showNotification();
               }, alarmPlay);

             

             }
     

     <% userNotes.forEach(function(Note) { %>
         
       showNotification("<%=Note.title%>", "<%=Note.content%>");  

       alarm("<%=Note.alarm%>");

       <%  console.log(Note); %>
             
     <% }); %>



   

         console.log(Notification.permission);
           if (Notification.permission === "granted") {
                   console.log("we have permission");
           } else if (Notification.permission !== "denied") {
             Notification.requestPermission().then(permission => {
                 console.log(permission);
             });
           }

 </script>