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
    document.querySelector('#oneemail-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#mymessages').textContent = '';
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#oneemail-view').style.display = 'none';
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
                let recipients = document.createElement('td');
                recipients.textContent = email.recipients;
                let sender = document.createElement('td');
                sender.textContent = email.sender;
                let timestamp = document.createElement('td');
                timestamp.textContent = email.timestamp;
                let subject = document.createElement('td')
                subject.textContent = email.subject;
                // create row and append display elements
                let erow = document.createElement('tr');
                if (!email.read) {
                    erow.setAttribute('data-unread', true);
                }
                erow.setAttribute('onclick', `gotoemail("${mailbox}", ${email.id})`);
                // display sender for inbox and archive, but recipients for sent
                if (mailbox == "sent") {
                    erow.appendChild(recipients);
                } else {
                    erow.appendChild(sender);
                }
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

// helper function to mark an email read.
async function markread(emailid) {
    let response = await fetch('/emails/' + emailid, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
    if (response.status >= 200 && response.status <=299) {
        return true;
    } else {
        return false;
    }
}

// helper function to archive and unarchive
async function changearchive(emailid, archivestatus) {
    let response = await fetch('/emails/' + emailid, {
        method: 'PUT',
        body: JSON.stringify({
            archived: archivestatus
        })
    });
    document.querySelector("#inbox").click();    
}
    


async function gotoemail(mailbox, emailid) {
    console.log(`goto email mailbox ${mailbox} emailid ${emailid}`)
    // hide others and activate this view 
    document.querySelector('#oneemail-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    const archivebutton = document.querySelector('#archive')

    // show archive button if in inbox folder and set click function
    if (mailbox == 'inbox') {
        archivebutton.innerHTML = 'Archive';
        archivebutton.removeAttribute('hidden');
        archivebutton.setAttribute('onclick', `changearchive(${emailid}, true)`);
    }

    // hide archive button if in "sent" folder
    if (mailbox == 'sent') {
        archivebutton.setAttribute('hidden', true);
        console.log('hiding archive button');
    }

    // change archive to unarchive if in archive folder
    if (mailbox == 'archive') {
        archivebutton.innerHTML = 'Unarchive';
        archivebutton.removeAttribute('hidden');
        archivebutton.setAttribute('onclick', `changearchive(${emailid}, false)`);
    }

    // locate email folder_content in DOM
    const oneemail_header = document.querySelector('#oneemail_header');
    const oneemail_body = document.querySelector('#oneemail_body');
    // clear out
    oneemail_header.innerHTML = '';
    oneemail_body.innerHTML = '';
    // fetch emailid
    let response = await fetch('/emails/' + emailid);
    let data = await response.json();
    if (response.status >= 200 && response.status <=299) {
        // folder content has email to display
        oneemail_header.innerHTML ='<p><b>From:</b> ' + data.sender + '<br><b>To:</b> ' + data.recipients +
                                '<br><b>Subject: </b>' + data.subject + '<br><b>Timestamp: </b>' + data.timestamp;
        oneemail_body.innerHTML = data.body;
        // mark item read - indicate error if necessary
        if (markread(emailid)) {
            return;
        }
        else {
            console.log('error marking read');
            oneemail_body.innerHTML = "Error marking item read";    
        }
    } else {
        oneemail_body.innerHTML = data.error;
    }
}