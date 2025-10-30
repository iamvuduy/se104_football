import React from 'react';
import './GroupCard.css';

const TeamRow = ({ teamName }) => {
    return (
        <div className="team-row">
            <span className="team-name">{teamName.toUpperCase()}</span>
        </div>
    );
};

const GroupCard = ({ groupName, headerColor, teams }) => {
    const headerStyle = {
        backgroundColor: headerColor,
    };

    return (
        <div className="group-card">
            <div className="group-card-header" style={headerStyle}>
                <h2>{groupName.toUpperCase()}</h2>
            </div>
            <div className="group-card-body">
                {teams && teams.map((team, index) => (
                    <TeamRow key={index} teamName={team.name} />
                ))}
            </div>
        </div>
    );
};

export default GroupCard;
