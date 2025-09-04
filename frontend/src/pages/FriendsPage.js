import React from 'react';
import Header from '../components/Header';
import FriendCard from '../components/FriendCard';
import ActivityFeed from '../components/ActivityFeed';

function FriendPage() {
    const friendsData = [
        { id: 'sarah-pg', name: 'Sarah_PG', image: '/assets/images/User Icon.png' },
        { id: 'john-smith', name: 'John_Smith', image: '/assets/images/User Icon.png' },
        { id: 'jane-doe', name: 'Jane_Doe', image: '/assets/images/User Icon.png' },
    ];

    const friendsActivity = [
        {
        user: 'Sarah_PG',
        action: 'started a new project',
        project: 'Data Analytics',
        project_id: 'data-analytics',
        time: '2025-08-01 10:15:00',
        tags: ['Python', 'Pandas']
        },
        {
        user: 'John_Smith',
        action: 'checked in changes',
        project: 'Personal Website',
        project_id: 'personal-website',
        time: '2025-08-05 13:22:00',
        tags: ['HTML', 'CSS', 'JavaScript']
        },
    ];

    return (
        <div className="friends-page">
        <Header />
        <div className="main-content">
            <div className="left-panel">
                <div className="friends-list-header">
                    <h1>All Friends</h1>
                </div>
                <div className="friends-list">
                    {friendsData.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                    ))}
                </div>
            </div>
            <div className="right-panel">
            <ActivityFeed activities={friendsActivity} />
            </div>
        </div>
        </div>
    );
}

export default FriendPage;