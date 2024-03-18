import React, { useEffect, useState } from 'react'
import { AddIcon, CheckIcon, ConnectionIcon, CrossIcon, LinkAddIcon, RemoveIcon } from '../common/Icons/Icons';

export default function EditAsset({ assetData, assetID, relationData }) {
    const dontDisplayList = ["Created at", "Updated at", "Hostname"];
    const [properties, setProperties] = useState({});
    const [relations, setRelations] = useState({});
    const [showButtons, setShowButtons] = useState(false);
    const [removedRelations, setRemovedRelations] = useState([]);
    const [addedRelations, setAddedRelations] = useState([]);
    const [showAddRelation, setShowAddRelation] = useState(false)

    const emptyRelation = { "from": "", "to": "", "owner": "", "direction": "" };
    const [newRelationData, setNewRelationData] = useState(emptyRelation)


    const handleSubmit = (e) => {
        console.log("remove RID: ", removedRelations);
        console.log("updated properties info: ", properties);
        console.log("added relations: ", addedRelations);
        e.preventDefault();
        // mutate({assetID: properties, "removedRelations": removedRelations, "addedRelations": addedRelations});
        // refetch() asset data etc.


        // maybe  handleReset() but should not be needed (instead of row below)
        setShowButtons(false);

    };
    const handleReset = () => {
        setProperties(assetData.properties);
        setRelations(relationData);
        setRemovedRelations([]);
        setNewRelationData(emptyRelation);
        setAddedRelations([])
        setShowButtons(false);
    };

    const removeRelation = (rid) => {
        setShowButtons(true)
        // Update displayed relations
        const { [rid]: _, ...updatedRelations } = relations;
        setRelations(updatedRelations);

        // Removed relations
        setRemovedRelations(currentRids => [...currentRids, rid])
    }

    const handleAddRelation = () => {
        setShowAddRelation(false)
        setShowButtons(true)
        setAddedRelations(addedrelations => [...addedrelations, newRelationData])
        setNewRelationData(emptyRelation)
    }

    useEffect(() => {
        handleReset();
    }, [assetID, relationData])


    return (
        <div className='asset-info-container'>
            <h1 style={{ marginBottom: "1rem" }}>{assetID}</h1>
            <form onSubmit={handleSubmit}>

                {Object.entries(properties).map(([key, value], index) => (
                    <div key={index}>
                        {
                            !dontDisplayList.includes(key) &&
                            <div className='inputContainer'>
                                <label className='inputLabel'>{key}</label>
                                <input
                                    className="inputFields"
                                    value={value}
                                    onChange={(e) => {
                                        setProperties({ ...properties, [key]: e.target.value });
                                        setShowButtons(true);
                                    }}
                                    id={key}
                                    type={(key == "Criticality") ? "number" : "text"}
                                    min={(key == "Criticality") ? 1 : null}
                                    max={(key == "Criticality") ? 5 : null}
                                    name={key}
                                />
                            </div>
                        }
                    </div>
                ))}

                <hr />

                <div >
                    <h3>Relations </h3>
                    <div className='relation-content_button'>
                        <div className="relations-container" >
                            {Object.entries(relations).map(([key, value]) => (
                                <div key={key} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{value.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{value.to}</a>
                                    <div onClick={() => removeRelation(key)}>
                                        <RemoveIcon size={22} color={"var(--error-color)"} />
                                    </div>
                                </div>

                            ))}
                            {addedRelations.map((relation, index) => (
                                <div key={index} className='relation'>
                                    <a style={{ marginRight: "1rem" }}>{relation.from}</a>
                                    <ConnectionIcon size={19} color={"var(--text-hover)"} />
                                    <a style={{ margin: "0rem 1rem" }}>{relation.to}</a>
                                    <LinkAddIcon size={22} color={"var(--success-color)"} />
                                </div>

                            ))}
                        </div>
                        {!showAddRelation &&
                            <div style={{ marginTop: "1.25rem" }} onClick={() => { setShowAddRelation(true) }}>
                                <AddIcon size={36} color={"var(--success-color)"} />
                            </div>
                        }
                        {showAddRelation &&
                            <div className='addRelation-container' style={{ marginTop: "1.25rem" }}>
                                <h3 style={{ marginBottom: "1rem" }}>Add Relation </h3>
                                {Object.entries(newRelationData).map(([key, value], index) => (
                                    <div key={index}>
                                        <div className='inputContainer'>
                                            <label className='inputLabel'>{`${key[0].toUpperCase()}${key.slice(1)}`}</label>
                                            <input
                                                className="inputFields"
                                                value={value}
                                                onChange={(e) => setNewRelationData({ ...newRelationData, [key]: e.target.value })}
                                                id={key}
                                                name={key}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="standard-button-container">
                                    <div style={{ marginRight: "2rem" }} onClick={handleAddRelation}>
                                        <CheckIcon size={35} color={"var(--success-color)"} />
                                    </div>
                                    <div onClick={() => setShowAddRelation(false)}>
                                        <CrossIcon size={35} color={"var(--error-color)"} />
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                {showButtons &&
                    <div className="standard-button-container">
                        <button className="standard-button" type="submit">Save</button>
                        <button className="standard-button" onClick={handleReset}>Cancel</button>
                        {/* <button className="standard-button" disabled={isLoading} type="submit">Save</button>
                    <button className="standard-button" disabled={isLoading} type="submit">Cancel</button> */}
                    </div>

                }
            </form>
        </div>
    )
}
