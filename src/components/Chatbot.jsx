import React, { useEffect, useRef, useState } from "react";
import { Card } from 'primereact/card';
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import Markdown from "react-markdown";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from "primereact/button";
import { Menu } from 'primereact/menu';

import "../styles/Chatbot.css";

const Chatbot = ({ t }) => {
    const [value, setValue] = useState('');
    const [tmp, setTmp] = useState('');
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState(false);

    const [message, setMessage] = useState([['請問是否要開立的故障通報?', '', '']]);

    const [woreportdetail, setWoreportdetail] = useState([]);

    const [curCnt, setCurCnt] = useState(0);
    const [tmpWOJP3, setTmpWOJP3] = useState('');

    // 故障通報狀態
    const [failureNotificationState, setFailureNotifcationState] = useState(0);
    const [failureMode, setFailureMode] = useState(false);
    const reportInfoArr = useRef([]);
    const trainCurrenStation = useRef('');
    const uploadInfo = useRef({});

    // 在組件頂部添加新的狀態
    const [isUploading, setIsUploading] = useState(false);

    // 添加 menu 的參考
    const menu = useRef(null);
    
    // 定義選單項目
    const items = [
        {
            label: '故障通報',
            icon: 'pi pi-exclamation-triangle',
            command: () => {
                handleReset();
                handleClicked({ target: { innerText: t('chatbot.report_type_f') } });
            }
        },
        // 之後可以在這裡添加更多選項
        {
            label: '其他功能',
            icon: 'pi pi-clock',
            disabled: true // 暫時禁用
        }
    ];

    // 添加新的狀態
    const [isLocationConfirm, setIsLocationConfirm] = useState(false);

    // 添加新的狀態
    const [modifyingField, setModifyingField] = useState(null);

    useEffect(() => {
        document.getElementById('content').scrollTop = document.getElementById('content').scrollHeight;
        // console.log('DEBUG', message);
    }, [message]);

    useEffect(() => {
        console.log('tmp: ', tmp)
        if (modifyingField) {
            // 處理修改欄位的輸入
            if (modifyingField === 'location') {
                trainCurrenStation.current = tmp;
            } else {
                uploadInfo.current[modifyingField] = tmp;
            }
            setModifyingField(null);
            showConfirmation();
        } else if (isLocationConfirm) {
            // 如果是在修正位置狀態
            trainCurrenStation.current = tmp;
            setIsLocationConfirm(false);
            setMessage([...message.slice(0, -1), [
                `確認位置在${tmp}站, 是否要回報至MMIS ?`,
                tmp, 
                'ONLYYESNOMODE'
            ]]);
        } else if (tmp === t('chatbot.report_type_f') || failureMode) {
            setFailureMode(true);

            switch (failureNotificationState) {
                case 0:
                    reportInfoArr.current.push(tmp);
                    console.log(failureNotificationState)
                    setMessage([...message.slice(0, -1), [t('chatbot.report_step_1'), tmp, '']]);
                    setFailureNotifcationState(failureNotificationState + 1)
                    break;
                case 1:
                    reportInfoArr.current.push(tmp);
                    console.log(failureNotificationState)
                    setMessage([...message.slice(0, -1), [t('chatbot.report_step_2'), tmp, '']]);
                    setFailureNotifcationState(failureNotificationState + 1)
                    break;
                case 2:
                    reportInfoArr.current.push(tmp);
                    console.log(failureNotificationState)
                    setMessage([...message.slice(0, -1), [t('chatbot.report_step_3'), tmp, '']]);
                    setFailureNotifcationState(failureNotificationState + 1)
                    break;
                case 3:
                    reportInfoArr.current.push(tmp);
                    console.log(failureNotificationState)
                    setMessage([...message.slice(0, -1), [t('chatbot.report_step_4'), tmp, '']]);
                    setFailureNotifcationState(failureNotificationState + 1)
                    break;
                case 4:
                    reportInfoArr.current.push(tmp);
                    setFailureNotifcationState(failureNotificationState + 1)
                    console.log('DEBUG(reportInfoArr.current): ', reportInfoArr.current);

                    // 直接呼叫 taiwanhelper API
                    console.log('開始發送請求到:', `https://taiwanhelper.com/api/get-train-live?no=${reportInfoArr.current[1]}`);
                    fetch(`https://taiwanhelper.com/api/get-train-live?no=${reportInfoArr.current[1]}`, {
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Origin': 'https://taiwanhelper.com',
                            'Referer': 'https://taiwanhelper.com/',
                            'Cache-Control': 'no-cache'
                        }
                    })
                    .then(res => {
                        console.log('收到響應:', res.status, res.statusText);
                        console.log('響應頭:', res.headers);
                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        return res.text().then(text => {
                            try {
                                return JSON.parse(text);
                            } catch (e) {
                                console.error('JSON parse error:', text);
                                throw new Error('Invalid JSON response');
                            }
                        });
                    })
                    .then(data => {
                        console.log('解析車次位置資料:', data);
                        
                        if (data.error) {
                            console.error('車次位置資料包含錯誤:', data.error);
                            throw new Error(data.message || data.error);
                        }
                        
                        // 找出車次所在車站代號
                        const trainNo = reportInfoArr.current[1];
                        let stationId = null;
                        
                        if (!data.stationLiveMap) {
                            console.error('車次位置資料缺少 stationLiveMap');
                            throw new Error('無法獲取車站資訊: 資料格式錯誤');
                        }
                        
                        // 遍歷 stationLiveMap 找出對應的車站代號
                        console.log('開始搜尋車站代號，車次:', trainNo);
                        Object.keys(data.stationLiveMap).forEach(key => {
                            console.log('檢查車站代號:', key);
                            if (key.startsWith(`${trainNo}_`)) {
                                stationId = key.split('_')[1];
                                console.log('找到對應車站代號:', stationId);
                            }
                        });

                        if (!stationId) {
                            console.error('找不到對應的車站代號');
                            setMessage([...message.slice(0, -1), [`該車次 ${trainNo} 目前找不到對應的站位置`, tmp, '']]);
                            return;
                        }

                        // 從 Supabase 獲取車站中文名稱
                        const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
                        console.log('開始查詢車站中文名稱，車站代號:', stationId);
                        
                        return fetch(`https://wumcinpwbjugkbqjszsf.supabase.co/rest/v1/train_station_details?station_id=eq.${stationId}`, {
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${SUPABASE_KEY}`
                            }
                        });
                    })
                    .then(res => {
                        console.log('收到車站資訊回應:', res.status, res.statusText);
                        if (!res.ok) {
                            throw new Error('無法獲取車站資訊: API 回應錯誤');
                        }
                        return res.json();
                    })
                    .then(stationData => {
                        console.log('解析車站資訊:', stationData);
                        
                        if (stationData && stationData.length > 0) {
                            const stationName = stationData[0].station_name;
                            console.log('成功獲取車站名稱:', stationName);
                            trainCurrenStation.current = stationName;
                            
                            const confirmMessage = `系統判斷目前車輛位置在${stationName}站，是否正確？`;
                            setMessage([...message.slice(0, -1), [
                                confirmMessage,
                                tmp, 
                                'LOCATIONCONFIRM'
                            ]]);

                            uploadInfo.current['trainsno'] = reportInfoArr.current[1];
                            uploadInfo.current['carno'] = reportInfoArr.current[2];
                            uploadInfo.current['desc'] = reportInfoArr.current[3];
                            uploadInfo.current['phone'] = reportInfoArr.current[4];

                            console.log('更新上傳資訊:', uploadInfo.current);
                        } else {
                            console.error('車站資訊資料為空');
                            throw new Error('無法獲取車站名稱: 查無資料');
                        }
                    })
                    .catch(err => {
                        console.error('完整錯誤資訊:', {
                            error: err,
                            message: err.message,
                            trainNo: reportInfoArr.current[1],
                            state: failureNotificationState,
                            uploadInfo: uploadInfo.current
                        });
                        
                        let errorMessage = '獲取車次資訊發生錯誤';
                        if (err.message.includes('無法獲取車站稱')) {
                            errorMessage = '無法取得車站名稱，請稍後再試';
                        } else if (err.message.includes('無法獲取車站資訊')) {
                            errorMessage = '無法取車站資訊，請確認車次號碼是否正確';
                        } else if (err.message.includes('HTTP error')) {
                            errorMessage = '網路連線異常，請稍後再試';
                        }
                        
                        setMessage([...message.slice(0, -1), [`${errorMessage}: ${err.message}`, tmp, '']]);
                    });
                    break;
                default:
                    break;
            }
        } else if (tmp !== '' && !formMode) {
            setLoading(true);

            // 先��定使用者的意圖，如果是回報工單則呼叫其他的模組
            fetch(`http://${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}/intent`, {
                method: "POST",
                body: JSON.stringify({ 'msg': tmp }),
            })
                .then(e => e.json())
                .then(intent => {
                    if (intent['message'].includes('回報工單')) {
                        const reg = /(\d{3}-(01|2A|3A|4A)-\d{5}-\d{3})/g
                        const a = tmp.match(reg);

                        if (woreportdetail.length === 0) {
                            // 列出工單可回報的檢修項目
                            if (a !== null) {
                                setTmpWOJP3(a);

                                fetch(`http://tra.webtw.xyz:9115/maximo/zz_llm/wo_report_detail?workorder=${a[0]}`)
                                    .then(e => e.json())
                                    .then(data => {
                                        let detail = data['workorders'];

                                        if (detail.length !== 0) setFormMode(true);

                                        for (let i = 0; i < detail.length; i++) {
                                            if (i === 0) {
                                                setMessage([...message.slice(0, -1), [{ '檢修項目': detail[i]['檢修項目'], '回報結果': '' }, tmp, 'FORMMODE']]);
                                            }

                                            let __tmp = woreportdetail;
                                            __tmp.push({ '檢修項目': detail[i]['檢修項目'], '回報結果': '' });
                                            setWoreportdetail(__tmp);
                                        }
                                    });
                            } else {
                                setMessage([...message.slice(0, -1), ['查無此工單!', tmp, '']]);
                            }
                        }
                        // 更新工單
                        else {
                            if (tmpWOJP3 !== '') {
                                console.log('DEBUG(tmpWOJP3): ', tmpWOJP3);
                                console.log('DEBUG(woreportdetail): ', woreportdetail)

                                let fetches = [];

                                for (let i = 0; i < woreportdetail.length; i++) {
                                    fetches.push(fetch(`http://${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}/update_wo/${tmpWOJP3}`, {
                                        method: "POST",
                                        body: JSON.stringify(woreportdetail[i])
                                    })
                                        .then(resp => resp.json())
                                        .then(result => {
                                            console.log(result);

                                        })
                                        .catch(e => {
                                            console.error(e);
                                            setMessage([...message, ['error', '', '']]);
                                        }));
                                }

                                Promise.all(fetches).then(function () {
                                    setTmpWOJP3('');
                                    setMessage([...message.slice(0, -1), [`回報完成，請查看工單: ${tmpWOJP3}`, tmp, '']]);
                                });
                            }

                        }

                        setLoading(false);
                    } else {
                        // let resp;
                        // let __data = { 'msg': tmp };
                        // const ws = new WebSocket(`ws://${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}/ws`);

                        // ws.onopen = (e) => {
                        //     ws.send(JSON.stringify(__data));
                        // };

                        // ws.onmessage = (e) => {
                        //     resp = e.data;
                        //     setMessage([...message.slice(0, -1), [resp, tmp, '']]);
                        //     setLoading(false);
                        //     ws.close();
                        // }

                        // ws.onerror = (e) => {
                        //     console.error(e)
                        //     setMessage([...message.slice(0, -1), ['error', tmp, '']]);
                        //     setLoading(false);
                        //     ws.close();
                        // }
                    }
                })
                .catch(err => {
                    setLoading(false);
                    setMessage([...message.slice(0, -1), [`err message: ${err}`, tmp, '']]);
                });
        }
    }, [tmp]);

    const footer = (
        <>
            <div className="p-inputgroup flex-1">
                {loading ?
                    <InputText id='user_i' value={value} readOnly={true} /> :
                    <InputText id='user_i' value={value} onChange={(e) => setValue(e.target.value)} onKeyUp={(e) => add_message(e)} />}
                <span className="p-inputgroup-addon hover:cursor-pointer ">
                    <i className="pi pi-send" onClick={(e) => add_message(e)} />
                </span>
            </div>
        </>
    )

    const add_message = (e) => {
        document.getElementById("user_i").readOnly = true;

        let user_i = document.getElementById("user_i").value;
        if (e.type === 'click') {
            setTmp(user_i);
            setMessage([...message, ['', user_i, '']]);
            setValue('');

            if (formMode && curCnt < woreportdetail.length) {
                let __tmp = woreportdetail;
                __tmp[curCnt]['回報結果'] = user_i;

                setWoreportdetail(__tmp);
                setCurCnt(curCnt + 1);
                setMessage([...message, [woreportdetail[curCnt + 1], user_i, 'FORMMODE']]);
            } else if (formMode && curCnt >= woreportdetail.length) {
                // reset parameters
                setCurCnt(0);
                setFormMode(false);
                setTmp('');
                setMessage([...message, ['檢修項目皆回報完畢，確認無誤後將會上傳資料至MMIS', user_i, '']]);
            }

        } else if (e.type === 'keyup') {
            if (e.keyCode === 13) {
                setTmp(user_i);
                setMessage([...message, ['', user_i, '']]);
                setValue('');

                if (formMode && curCnt + 1 < woreportdetail.length) {
                    let __tmp = woreportdetail;
                    __tmp[curCnt]['回報結果'] = user_i;

                    setWoreportdetail(__tmp);
                    setCurCnt(curCnt + 1);
                    let __cnt = curCnt + 1;
                    setMessage([...message, [woreportdetail[__cnt], user_i, 'FORMMODE']]);
                } else if (formMode && curCnt + 1 >= woreportdetail.length) {
                    let __tmp = woreportdetail;
                    __tmp[curCnt]['回報結果'] = user_i;
                    setWoreportdetail(__tmp);

                    // reset parameters
                    setCurCnt(0);
                    setFormMode(false);
                    setTmp('');
                    setMessage([...message, ['檢修項目皆回報完畢，確認無誤後將會上傳資料至MMIS', user_i, '']]);
                }
            }
        }

        document.getElementById("user_i").readOnly = false;
        document.getElementById("user_i").focus();
    }

    const handleClicked = (e) => {
        console.log('DEBUG(e): ', e.target)
        setTmp(e.target.innerText)
            setMessage([...message, ['', e.target.innerText, '']]);
    };

    const ai_message = (v, idx) => {
        return (
            <div className="flex items-start gap-3 my-4">
                <Avatar 
                    label="A" 
                    size="large" 
                    style={{ backgroundColor: '#003C9D', color: '#ffffff' }} 
                    shape="circle" 
                />
                <div className="message-bubble ai-message">
                    {typeof v === 'string' ? 
                        (v.includes('<a') ? 
                            <div dangerouslySetInnerHTML={{ __html: v }} /> 
                            : <Markdown>{v}</Markdown>)
                        : v
                    }
                    {isUploading && idx === message.length - 1 && (
                        <div className="loading-dots mt-2">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    )}
                    {message.length === 1 && (
                        <Button 
                            id="button-1" 
                            label={t('chatbot.report_type_f')} 
                            onClick={handleClicked} 
                            className="mt-3"
                        />
                    )}
                    {message[message.length - 1][2] === 'ONLYYESNOMODE' && idx === message.length - 1 && !isUploading && (
                        <div className="flex gap-2 mt-3">
                            <Button 
                                id="button-1" 
                                label={t('yes')} 
                                onClick={() => {
                                    console.log('確認按鈕被點擊');
                                    handleConfirm();
                                }} 
                            />
                            <Button 
                                id="button-1" 
                                label={t('no')} 
                                onClick={() => {
                                    console.log('取消按鈕被點擊');
                                    handleCancel();
                                }} 
                            />
                        </div>
                    )}
                    {message[message.length - 1][2] === 'RESUBMITMODE' && idx === message.length - 1 && (
                        <div className="flex gap-2 mt-3">
                            <Button 
                                id="button-1" 
                                label={t('yes')} 
                                onClick={() => {
                                    console.log('重新回報按鈕被點擊');
                                    handleResubmit();
                                }} 
                            />
                            <Button 
                                id="button-1" 
                                label={t('no')} 
                                onClick={() => {
                                    setMessage([...message.slice(0, -1), ['感謝您的回報', tmp, '']]);
                                }} 
                            />
                        </div>
                    )}
                    {message[message.length - 1][2] === 'LOCATIONCONFIRM' && idx === message.length - 1 && (
                        <div className="flex gap-2 mt-3">
                            <Button 
                                id="button-1" 
                                label={t('yes')} 
                                onClick={() => handleLocationConfirm(true)} 
                            />
                            <Button 
                                id="button-1" 
                                label={t('no')} 
                                onClick={() => handleLocationConfirm(false)} 
                            />
                        </div>
                    )}
                    {message[message.length - 1][2] === 'CONFIRMUPLOAD' && idx === message.length - 1 && (
                        <div className="flex flex-col gap-2 mt-3">
                            <div className="flex gap-2">
                                <Button 
                                    id="button-1" 
                                    label="修改車次"
                                    onClick={() => handleModifyField('trainsno')} 
                                />
                                <Button 
                                    id="button-1" 
                                    label="修改車號"
                                    onClick={() => handleModifyField('carno')} 
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    id="button-1" 
                                    label="修改故障內容"
                                    onClick={() => handleModifyField('desc')} 
                                />
                                <Button 
                                    id="button-1" 
                                    label="修改電話"
                                    onClick={() => handleModifyField('phone')} 
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    id="button-1" 
                                    label="修改位置"
                                    onClick={() => handleModifyField('location')} 
                                />
                            </div>
                            <Button 
                                id="button-1" 
                                label="確認無誤，送出通報"
                                onClick={handleConfirm}
                                className="mt-2" 
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ai_message_loading = () => {
        return (
            <div className="flex items-start gap-3 my-4">
                <Avatar 
                    label="A" 
                    size="large" 
                    style={{ backgroundColor: '#1a7f64', color: '#ffffff' }} 
                    shape="circle" 
                />
                <div className="message-bubble ai-message">
                    <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>
            </div>
        );
    };

    const human_message = (v) => {
        return (
            <div className="flex items-start gap-3 my-4 flex-row-reverse">
                <Avatar 
                    label="H" 
                    size="large" 
                    style={{ backgroundColor: '#146856', color: '#ffffff' }} 
                    shape="circle" 
                />
                <div className="message-bubble human-message">
                    <Markdown>{v}</Markdown>
                </div>
            </div>
        );
    };

    const handleConfirm = () => {
        console.log('開始處理確認操作');
        console.log('上傳資訊:', uploadInfo.current);
        
        setIsUploading(true);
        setMessage([...message.slice(0, -1), ['正在上傳故障通報資料，請稍候...', tmp, '']]);
        
        const body = {
            "carno": uploadInfo.current['carno'],
            "trainno": uploadInfo.current['trainsno'],
            "failureDate": `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
            "failureTime": `${new Date().getHours()}:${new Date().getMinutes()}`,
            "failureLocation": trainCurrenStation.current,
            "failureDescription": uploadInfo.current['desc'],
            "driverPhone": uploadInfo.current['phone'],
            "accidentLevel": "C",
            "createby": window.LoginUser
        };

        console.log('準備發送的資料:', body);

        fetch(`http://10.10.10.115:9999/upload_fnm`, {
            method: "POST",
            body: JSON.stringify({ 'msg': body }),
            headers: {
                "Content-Type": "application/json",
            },
            mode: 'cors',
            credentials: 'include',
        })
        .then(res => {
            console.log('收到回應:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('處理回應數據:', data);
            setIsUploading(false); // 結束上傳狀態
            if (data['success']) {
                const _tmp = `已成功立案故障通報${uploadInfo.current['carno']}，<a href="${data['srurl']}" target="_blank" rel="noopener noreferrer">點此查看</a>，是否要再次回報？`;
                setMessage([...message.slice(0, -1), [_tmp, tmp, 'RESUBMITMODE']]);
            } else {
                setMessage([...message.slice(0, -1), [data['error'], tmp, '']]);
            }
        })
        .catch(err => {
            console.error('發生誤:', err);
            setIsUploading(false); // 結束上傳狀態
            setMessage([...message.slice(0, -1), ['上傳過程發生錯誤: ' + err.message, tmp, '']]);
        });
    };

    const handleResubmit = () => {
        console.log('重新開始回報流程');
        // 重置所有相關狀態
        setFailureMode(false);
        setFailureNotifcationState(0);
        reportInfoArr.current = [];
        trainCurrenStation.current = '';
        uploadInfo.current = {};
        // 重新開始對話
        setMessage([['請問需要甚麼幫助?', '', '']]);
    };

    const handleCancel = () => {
        console.log('取消操作被觸發');
        setMessage([...message.slice(0, -1), ['已取消回報', tmp, '']]);
    };

    const handleReset = () => {
        console.log('重置對話');
        // 重置所有狀態
        setFailureMode(false);
        setFailureNotifcationState(0);
        reportInfoArr.current = [];
        trainCurrenStation.current = '';
        uploadInfo.current = {};
        setFormMode(false);
        setCurCnt(0);
        setTmpWOJP3('');
        setValue('');
        setTmp('');
        // 重新開始對話
        setMessage([['請問需要甚麼幫助?', '', '']]);
    };

    const handleLocationConfirm = (isCorrect) => {
        if (isCorrect) {
            // 如果位置正確，顯示確認資訊
            showConfirmation();
        } else {
            // 如果位置不正確，要求輸入正確位置
            setIsLocationConfirm(true);
            setMessage([...message.slice(0, -1), [
                t('chatbot.input_location'),
                tmp,
                ''
            ]]);
        }
    };

    // 添加確認資料的函數
    const showConfirmation = () => {
        const confirmationMessage = `
請確認以下資訊是否正確：

🚂 車次：${uploadInfo.current['trainsno']}
🚃 車號：${uploadInfo.current['carno']}
📝 故障內容：${uploadInfo.current['desc']}
📱 司機員電話：${uploadInfo.current['phone']}
📍 故障位置：${trainCurrenStation.current}
    `;
        
        setMessage([...message.slice(0, -1), [confirmationMessage, tmp, 'CONFIRMUPLOAD']]);
    };

    // 添加修改欄位的處理函數
    const handleModifyField = (field) => {
        setModifyingField(field);
        setMessage([...message.slice(0, -1), [
            t(`chatbot.modify_field.${field}`),
            tmp,
            'MODIFYFIELD'
        ]]);
    };

    return (
        <>
            <div className="chat-title">
                <div className="flex items-center gap-3">
                    <i className="pi pi-train"></i>
                    <span>臺鐵新MMIS智能助手</span>
                </div>
                <div className="menu-container">
                    <i 
                        className="pi pi-bars cursor-pointer hover:text-gray-200 transition-colors"
                        onClick={(e) => menu.current.toggle(e)}
                        title="功能選單"
                    />
                    <Menu 
                        model={items} 
                        popup 
                        ref={menu}
                        className="menu-overlay"
                    />
                </div>
            </div>
            <div className="chat-container">
                <Card className="w-full shadow-none border-none p-0">
                    <div id="content">
                        {message.map((e, idx) => (
                            <React.Fragment key={idx}>
                                {e[1] !== '' && human_message(e[1])}
                                {e[0] === '' && loading 
                                    ? ai_message_loading()
                                    : e[2] !== 'FORMMODE' 
                                        ? ai_message(e[0], idx)
                                        : ai_message(
                                            <DataTable value={[e[0]]}>
                                                <Column field="檢修項目" header="檢修項目" />
                                                <Column field="回報結果" header="回報結果" />
                                            </DataTable>
                                        , idx)
                                }
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="input-container">
                        <div className="p-inputgroup">
                            <InputText
                                id='user_i'
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyUp={add_message}
                                placeholder="輸入訊息..."
                                readOnly={loading}
                            />
                            <Button 
                                icon="pi pi-send" 
                                onClick={add_message}
                                className="p-button-text"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default Chatbot;