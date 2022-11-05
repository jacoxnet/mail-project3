document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email());
    document.querySelector('#send_email').addEventListener('click', () => send_email())

  // By default, load the inbox
  load_mailbox('inbox');
});

//
// compose - set up and clear fields for email input
//      sent button calls sendemail
//      optional arguments used to pass in old email for reply
//
async function compose_email(oldemailid=null) {
    console.log(`entering compose email with oldemailid = ${oldemailid}`);
    // Show compose view and hide other views
    document.querySelector('#oneemail-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    // if we're replying, load old email
    if (oldemailid) {
        let response = await fetch('/emails/' + oldemailid);
        let data = await response.json();
        document.querySelector('#mymessages').textContent = 'Replying';
        document.querySelector('#compose-recipients').value = data.sender;
        const newsubject = (data.subject.slice(0,4) == 'Re: ')? data.subject : 'Re: ' + data.subject;
        document.querySelector('#compose-subject').value = newsubject;
        document.querySelector('#compose-body').value = `\n\nOn ${data.timestamp}, ${data.sender} wrote:\n${data.body}\n`;
    } else {
        // otherwise, blank out fields
        document.querySelector('#mymessages').textContent = 'Composing'
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }
}

// 
// load and display a mailbox list
//
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

//
// send email
//
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
        document.querySelector("#sent").click();  
    } else {
        document.querySelector('#mymessages').textContent = data.error;
    }
}

//
// markread - helper function to mark an email read.
//      called from gotoemail
//
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

//
// changearchive - helper function to archive and unarchive
//      called from gotoemail
//
async function changearchive(emailid, archivestatus) {
    let response = await fetch('/emails/' + emailid, {
        method: 'PUT',
        body: JSON.stringify({
            archived: archivestatus
        })
    });
    document.querySelector("#inbox").click();    
}
    
//
// gotoemail - display the full content of an email
//      called when click on email in mailbox list
//      has reply button and (if not sent mailbox) archive
//      button
//  
//      arguments: mailbox name, email id number
//      (we need mailbox name because behavior differs
//      for archive button)
//
async function gotoemail(mailbox, emailid) {
    // hide others and activate this view 
    document.querySelector('#oneemail-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    const archivebutton = document.querySelector('#archive');
    const replybutton = document.querySelector('#reply');
    // set up reply button functionality
    replybutton.setAttribute('onclick', `compose_email(${emailid})`);
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
    // fetch email from id
    let response = await fetch('/emails/' + emailid);
    let data = await response.json();
    if (response.status >= 200 && response.status <=299) {
        // folder content has email to display
        oneemail_header.innerHTML ='<p><b>From:</b> ' + data.sender + '<br><b>To:</b> ' + data.recipients +
                                '<br><b>Subject: </b>' + data.subject + '<br><b>Timestamp: </b>' + data.timestamp;
        oneemail_body.innerHTML = data.body;
        // mark item read - indicate error if necessary
        markread(emailid);
    } else {
        oneemail_body.innerHTML = data.error;
    }
}