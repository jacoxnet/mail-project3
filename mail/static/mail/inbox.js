document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#send_email').addEventListener('click', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#mymessages').textContent = '';
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox, err=false) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    const folder_title = document.querySelector('#folder_title');
    const folder_content = document.querySelector('#folder_content');
    
    // Set folder title and clear content
    folder_title.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    folder_content.innerHTML = '';

    // get and display email results
    response = await fetch(`/emails/${mailbox}`)
    if (response.status >= 200 && response.status <= 299) {
        let emails = await response.json();
        if (emails.length > 0) {
            // create table structure
            let tbody = document.createElement('tbody');
            let table = document.createElement('table');
            table.setAttribute('class', 'table');
            
            emails.forEach(email => {    
                // extract display elements for each email
                let id = document.createElement('td');
                id.textContent = email.id;
                let recipients = document.createElement('td');
                recipients.textContent = email.recipients;
                let timestamp = document.createElement('td');
                timestamp.textContent = email.timestamp;
                let subject = document.createElement('td')
                subject.textContent = email.subject;
                // create row and append display elements
                let erow = document.createElement('tr');
                erow.appendChild(id);
                erow.appendChild(recipients);
                erow.appendChild(subject);
                erow.appendChild(timestamp);
                tbody.appendChild(erow);
            });
            table.appendChild(tbody);
            folder_content.appendChild(table);
        } else {
            // if no emails were retrieved but not an error
            folder_content.innerHTML = '<i>No emails to display</i>';
        }
    }
    else {
        // error on retrieval
        folder_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

async function send_email() {
    /* retrieve info from DOM fields */
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value; 
    /* send to server */
    let response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    });
    let data = await response.json();
    // if message sent successfully, display resulting status msg
    if (response.status >= 200 && response.status <=299) {    
        document.querySelector('#mymessages').textContent = data.message;
        // now clear out fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    } else {
        document.querySelector('#mymessages').textContent = data.error;
    }
}