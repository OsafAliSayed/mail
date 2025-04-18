var is_sidebar_open = true;
document.addEventListener('DOMContentLoaded', function() {

  var trigger; //trigger is set to true if mailbox is sent
  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('.close-button').addEventListener('click', () => toggle_side_bar())  
  // By default, load the inbox
  load_mailbox('inbox');
  
  //EventListeners
  document.querySelector("#compose-form").addEventListener('submit', send_mail);
  var mails;
});

function toggle_side_bar() {
  var sidebar = document.querySelector(".side-bar");
  console.log(sidebar);
  if (is_sidebar_open) {
    sidebar.style.display = 'none';
  }
  else {
    sidebar.style.display = 'flex';
  }
  is_sidebar_open = !is_sidebar_open
}

function compose_email() {
  // set the side bar active state
  activate_sidebar('compose');
    
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function activate_sidebar(id) {
  document.querySelector('#sent').parentElement.classList.remove('active');
  document.querySelector('#inbox').parentElement.classList.remove('active');
  document.querySelector('#archived').parentElement.classList.remove('active');
  document.querySelector('#compose').parentElement.classList.remove('active');
  document.querySelector(`#${id}`).parentElement.classList.add('active');
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'flex';
  document.querySelector('#compose-view').style.display = 'none';
  
  var html;
  // if the sent button is clicked
  if (mailbox === 'sent') {
    trigger = true;
    // set the side bar active state
    activate_sidebar('sent');
    //fetching all mails that were sent and creating a response string 
    fetch('/emails/sent')
    .then(response => response.json())
    .then(result => {
        html = result.map(element => {
        return `<div class="mail" data-id="${element.id}">
        <div class="sender" >${element.sender}</div>
        <div class="subject">${element.subject}</div>
        <div class="timestamp">${element.timestamp}</div>
      </div>`
      }).join('');
      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `
      ${html}
      `
      //updating mails array
      mails = [...document.querySelectorAll(".mail")];
      
      //add event listeners for mail
      mails.forEach(element => element.addEventListener('click', open_mail));
    });
  }
  
  //if inbox button is clicked 
  else if (mailbox === 'inbox')
  {
    trigger = false;
    // set the side bar active state
    activate_sidebar('inbox');
    
    //fetching all the emails recieved by user and creating a string of html to update the DOM
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(result => {
      html = result.map(element => {
        return `<div class="mail" data-id="${element.id}" style="background-color: ${(element.read == true) ? "#f2f6fc" : "white"}; ${(element.read == false) ? "font-weight: bold;" : ""}">
                  <div class="sender col-2">${element.sender}</div>
                  <div class="subject col-8">${element.subject} - ${element.body} </div>
                  <div class="timestamp col-2">${element.timestamp}</div>
                </div>`
      }).join('');

      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `
      ${html}
      `;
      
      //updating mails array
      mails = [...document.querySelectorAll(".mail")];
      
      //add event listeners for mail
      mails.forEach(element => element.addEventListener('click', open_mail));
    })
  }
  //if archive button is clicked 
  else if (mailbox === 'archive')
  {
    trigger = false;
    // set the side bar active state
    activate_sidebar('archived');
    
    //fetching archived mails and creating a list for updating the DOM
    fetch('/emails/archive')
    .then(response => response.json())
    .then(result => {
      html = result.map(element => {
        return `<div class="mail" data-id="${element.id}" style="background-color: ${(element.read == true) ? "#f2f6fc" : "white"};">
        <div class="sender">${element.sender}</div>
        <div class="subject">${element.subject}</div>
        <div class="timestamp">${element.timestamp}</div>
      </div>`
      }).join('');
      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `
      ${html}
      `
      
      //updating mails array
      mails = [...document.querySelectorAll(".mail")];
      
      //add event listeners for mail
      mails.forEach(element => element.addEventListener('click', open_mail));
    });  
  } 
  
}

//function to send an email through compose
function send_mail(e)
{
  //to prevent from form submission
  e.preventDefault()

  //taking input
  const recipients = this.querySelector("#compose-recipients").value;
  const subject = this.querySelector("#compose-subject").value;
  const body = this.querySelector("#compose-body").value;
  console.log(`RECEIPIENT: ${recipients}\nSUBJECT: ${subject}\nBODY: ${body}`);
  //sending mail through post request
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result.message)
      //Returning a message
      document.querySelector("#message").innerHTML = 
      `<div class="alert alert-primary alert-dismissible fade show" role="alert">
        ${result.message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>`
      load_mailbox('sent')
  });
}


function open_mail ()
{
  //fetching the mail data
  fetch(`emails/${this.dataset.id}`)
  .then(response => response.json())
  .then(result => { 
    //generating the display data
    const html = 
      `
      <div class="form-group">
        From: <input disabled class="form-control" value=${result.sender}>
      </div>
      <div class="form-group">
        Recipients: <input disabled class="form-control" value=${result.recipients}>
      </div>
      <div class="form-group">
        Subject: <input disabled class="form-control" value="${result.subject}">
      </div>
      <div class="form-group">
        Body: <textarea class="form-control" disabled>${result.body}</textarea>
      </div>
       
      <div class="d-flex">
        ${(trigger == false) ? `<div class="form-group">
        <input type="submit" class="btn btn-primary" id="archiveBtn" value=${(result.archived == true) ? "Unarchive" : "Archive"}>
      </div>`: ""}
        
        <div class="form-group ml-2">
          <input type="submit" class="btn btn-primary" id="reply" value="Reply">
        </div>
      </div>
      `

      //updating emails-view
      document.querySelector('#emails-view').innerHTML = 
      `
      ${html}
      `
      //adding archived button event listener
      const isArchived = (result.archived == true) ? true : false;
      document.querySelector("#archiveBtn").addEventListener("click", () => {
        //if isarchived unarchive the mail
        if(isArchived)
        {
          //request for archiving on response load mailbox
          fetch(`/emails/${result.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          .then(() => {
            document.querySelector("#message").innerHTML = 
            `<div class="alert alert-primary alert-dismissible fade show" role="alert">
              "Message Unarchived!"
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            </div>`
            load_mailbox('inbox');
          })
          
        }
        else
        {
          fetch(`/emails/${result.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          .then(() => {
            document.querySelector("#message").innerHTML = 
            `<div class="alert alert-primary alert-dismissible fade show" role="alert">
              "Message Archived!"
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            </div>`
            load_mailbox('archive');
          })
        }
      });
      
      //adding reply button
      document.querySelector("#reply").addEventListener("click", () => {
        // Show compose view and hide other views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';
  
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = result.sender;
        document.querySelector('#compose-subject').value = (result.subject.includes('Re:')) ? result.subject : "Re: " + result.subject;
        document.querySelector('#compose-body').value = `<On ${result.timestamp} ${result.sender} wrote:\n${result.body}>\n`;
      });
      //mark as read
      fetch(`/emails/${result.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    });
}