document.addEventListener('DOMContentLoaded', function() {

  var trigger; //trigger is set to true if mailbox is sent

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
    
  // By default, load the inbox
  load_mailbox('inbox');
  
  //EventListeners
  document.querySelector("#compose-form").addEventListener('submit', send_mail);
  var mails;
});

function compose_email() 
{
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox)
{
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'flex';
  document.querySelector('#compose-view').style.display = 'none';
  
  var html;
  // if the sent button is clicked
  if (mailbox === 'sent')
  {
    trigger = true;
    //fetching all mails that were sent and creating a response string 
    fetch('/emails/sent')
    .then(response => response.json())
    .then(result => {
        html = result.map(element => {
        return `<div class="mail mt-2" data-id="${element.id}">
        <div class="sender" >${element.sender}</div>
        <div class="subject">${element.subject}</div>
        <div class="timestamp">${element.timestamp}</div>
      </div>`
      }).join('');
      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
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
    //fetching all the emails recieved by user and creating a string of html to update the DOM
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(result => {
      html = result.map(element => {
        return `<div class="mail mt-2" data-id="${element.id}" style="background-color: ${(element.read == true) ? "#DCDCDC" : "white"};">
                  <div class="sender">${element.sender}</div>
                  <div class="subject">${element.subject}</div>
                  <div class="timestamp">${element.timestamp}</div>
                </div>`
      }).join('');

      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
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
    //fetching archived mails and creating a list for updating the DOM
    fetch('/emails/archive')
    .then(response => response.json())
    .then(result => {
      html = result.map(element => {
        return `<div class="mail mt-2" data-id="${element.id}" style="background-color: ${(element.read == true) ? "#DCDCDC" : "white"};">
        <div class="sender">${element.sender}</div>
        <div class="subject">${element.subject}</div>
        <div class="timestamp">${element.timestamp}</div>
      </div>`
      }).join('');
      //updating the inner HTML of table 
      document.querySelector('#emails-view').innerHTML = 
      `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
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