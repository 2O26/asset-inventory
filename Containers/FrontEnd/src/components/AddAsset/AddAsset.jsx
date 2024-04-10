import React, { useState } from 'react';
import Modal from 'react-modal';
import './AddAsset.css';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { UpdateAsset } from '../Services/ApiService';

export default function AddAsset() {
    const [data, setData] = useState({ name: "", type: "", crit: 1, owner: "" });
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();

    const { mutate: addAsset, isLoading, isError, error } = useMutation({
        mutationFn: UpdateAsset,
        onSuccess: () => {
            queryClient.invalidateQueries(['getState']);
            setOpen(false);
            setData({ name: "", type: "", crit: 1, owner: "" });
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const assetData = {
            addAsset: [{
                Name: data.name,
                Type: data.type.split(','),
                Criticality: parseInt(data.crit, 10),
                Owner: data.owner
            }]
        };
        addAsset(assetData);
    };

    return (
        <div>
            <button onClick={() => setOpen(true)} className="standard-button">Add Asset</button>
            <Modal
                isOpen={open}
                ariaHideApp={false}
                contentLabel="Add Asset"
                overlayClassName="reactModalOverlay"
                className="reactModalContent"
                shouldCloseOnOverlayClick={true}
                onRequestClose={() => setOpen(false)}
            >
                <div>
                    <form onSubmit={handleSubmit} className='asset-form'>
                        <h2>Add Asset</h2>
                        <label htmlFor="asset-name">Asset Name</label>
                        <input className="inputFields" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} type="text" placeholder="Server A" id="asset-name" name="asset-name" required />
                        <label htmlFor="asset-criticality">Criticality</label>
                        <input className="inputFields" value={data.crit} onChange={(e) => setData({ ...data, crit: e.target.value })} type="number" id="asset-criticality" name="asset-criticality" min="1" max="5" required />
                        <label htmlFor="asset-type">Type</label>
                        <input className="inputFields" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })} type="text" placeholder="Web Server" id="asset-type" name="asset-type" required />
                        <label htmlFor="asset-owner">Owner</label>
                        <input className="inputFields" value={data.owner} onChange={(e) => setData({ ...data, owner: e.target.value })} type="text" placeholder="John Doe" id="asset-owner" name="asset-owner" required />
                        {isLoading && <LoadingSpinner />}
                        {isError && <p className="errorMessage">{error.message}</p>}
                        <div className="AuthBtnContainer">
                            <button className="standard-button" disabled={isLoading} type="submit">Add</button>
                            <button className="standard-button" onClick={() => setOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}