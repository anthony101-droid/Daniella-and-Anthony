export function platformFeedback(rating:number,comment:string){
 const text=comment.trim();
 if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('Choose a rating from 1 to 5.');
 if(text.length<10||text.length>3900)throw Error('Enter a comment between 10 and 3,900 characters.');
 return {action:'support-submit',category:'Feedback',target:'platform',subject:`PhishAware feedback · ${rating}/5`,message:`Platform rating: ${rating}/5\n\n${text}`};
}
