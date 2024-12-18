export async function ask_bot(user_q) {
    const testing_data = ['Hi', 'Today is sunday', 'Nice to meet you', "Hey there! How's it going?", "What's up? Hope you're having an awesome day!", "Revenue & Earnings: Look for steady growth in revenue and earnings."];

    let a = new Promise((res, rej) => {
        setTimeout(() => {
            res(testing_data[new Date().getMilliseconds() % (testing_data.length)]);
        }, 1000);
    });

    let data = { 'msg': user_q };

    let resp = fetch('http://10.10.10.168:9999/ask', {
        method: "POST", // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: new Headers({
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
        }),
    });

    //   let resp = fetch('http://10.10.10.168:9999/', {
    //     method: "GET", // or 'PUT'        
    //     headers: new Headers({
    //       "Content-Type": "application/json",
    //     }),
    //   })    ;


    return resp;
};



export async function getStation(carno) {


    let resp = fetch(`http://10.10.10.168:9999/station_data/${carno}`, {
        method: 'GET',
        headers: new Headers({
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': "*"
        })
    });
    return resp;
};
 