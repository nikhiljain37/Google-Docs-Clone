import { useEffect, useState, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Box, Button } from '@mui/material';
import styled from '@emotion/styled';
import html2pdf from 'html2pdf.js';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const Component = styled.div`
    background: #F5F5F5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
];


const Editor = () => {
    const [socket, setSocket] = useState(null);
    const [quill, setQuill] = useState(null);
    const { id } = useParams();
    const editorRef = useRef(null); // Ref for the editor container

    // Function to handle downloading the document as PDF
    const handleDownload = () => {
        // Check if Quill instance is available
        if (quill) {
            // Get Quill content as HTML
            const quillContent = quill.root.innerHTML;
            // Convert Quill content to PDF
            html2pdf().from(quillContent).save();
            console.log("Document downloaded as PDF!");
        }
    };

    useEffect(() => {
        const socketServer = io('https://google-docs-clone-dn7g.onrender.com');
        setSocket(socketServer);

        return () => {
            socketServer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket || !editorRef.current) return;

        const quillInstance = new Quill(editorRef.current, {
            theme: 'snow',
            modules: { toolbar: toolbarOptions },
        });
        quillInstance.disable();
        quillInstance.setText('Loading the document...');
        setQuill(quillInstance);

        socket.once('load-document', document => {
            quillInstance.setContents(document);
            quillInstance.enable();
        });

        socket.emit('get-document', id);

        const handleChange = (delta, oldData, source) => {
            if (source !== 'user') return;
            socket.emit('send-changes', delta);
        };

        quillInstance.on('text-change', handleChange);

        const saveInterval = setInterval(() => {
            socket.emit('save-document', quillInstance.getContents());
        }, 2000);

        return () => {
            clearInterval(saveInterval);
            socket.off('load-document');
            socket.off('send-changes');
            quillInstance.off('text-change', handleChange);
        };
    }, [socket, id]);

    useEffect(() => {
        if (!socket || !quill) return;

        // Listen for changes from other clients
        socket.on('receive-changes', delta => {
            quill.updateContents(delta);
        });

        // Focus Quill editor on click
        const editorElement = editorRef.current;
        editorElement.addEventListener('click', () => {
            quill.focus();
        });

        return () => {
            socket.off('receive-changes');
            editorElement.removeEventListener('click', () => {
                quill.focus();
            });
        };
    }, [socket, quill]);

    return (
        <Component>
            <Box className='container' ref={editorRef}></Box>
            <Button variant="contained" color="primary" onClick={handleDownload}>Download as PDF</Button>
        </Component>
    );
};

export default Editor;
