import * as React from 'react';
import { Item, User } from '../types';
import { ClockIcon, CheckIcon, UserIcon, TrashIcon } from './icons';
import { formatRelativeTime } from '../timeUtils';

interface ActividadRecienteProps {
    items: Item[];
}

interface Activity {
    id: string;
    type: 'added' | 'completed' | 'deleted';
    user: User;
    itemName: string;
    date: Date;
}

const ActividadReciente: React.FC<ActividadRecienteProps> = ({ items }) => {
    const recentActivity = React.useMemo(() => {
        const activities: Activity[] = [];

        for (const item of items) {
            // Process 'added' activity: ensure createdAt is a valid Date object.
            if (item.addedBy && item.createdAt && item.createdAt instanceof Date) {
                activities.push({
                    id: `${item.id}-added`,
                    type: 'added',
                    user: item.addedBy,
                    itemName: item.name,
                    date: item.createdAt,
                });
            }
            
            const isFullyCompleted = item.quantity > 0 && item.completedQuantity >= item.quantity;
            // Process 'completed' activity: ensure the item is completed and completedAt is a valid Date object.
            if (isFullyCompleted && item.completedBy && item.completedAt && item.completedAt instanceof Date) {
                activities.push({
                    id: `${item.id}-completed`,
                    type: 'completed',
                    user: item.completedBy,
                    itemName: item.name,
                    date: item.completedAt,
                });
            }

            // Process 'deleted' activity
            if (item.deleted && item.deletedBy && item.deletedAt && item.deletedAt instanceof Date) {
                activities.push({
                    id: `${item.id}-deleted`,
                    type: 'deleted',
                    user: item.deletedBy,
                    itemName: item.name,
                    date: item.deletedAt,
                });
            }
        }

        // Sort activities by date, most recent first, and limit to the last 7 activities.
        return activities
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 7);
    }, [items]);

    const userStyles: Record<User, { text: string; completedBg: string; addedBg: string; addedText: string }> = {
        [User.FELIPE]: {
            text: 'text-indigo-600',
            completedBg: 'bg-indigo-600',
            addedBg: 'bg-indigo-100',
            addedText: 'text-indigo-600',
        },
        [User.VALERIA]: {
            text: 'text-pink-500',
            completedBg: 'bg-pink-500',
            addedBg: 'bg-pink-100',
            addedText: 'text-pink-500',
        },
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center space-x-2 mb-5">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-700">Actividad Reciente</h3>
            </div>
            {recentActivity.length > 0 ? (
                <ul className="space-y-4">
                    {recentActivity.map(activity => {
                        const styles = userStyles[activity.user];
                        const iconContainerBaseClasses = "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center";
                        let icon;
                        let actionText;
                        
                        if (activity.type === 'completed') {
                            actionText = 'completó';
                            icon = (
                                <div className={`${iconContainerBaseClasses} ${styles.completedBg}`}>
                                    <CheckIcon className="h-4 w-4 text-white" />
                                </div>
                            );
                        } else if (activity.type === 'deleted') {
                            actionText = 'eliminó';
                            icon = (
                                <div className={`${iconContainerBaseClasses} bg-red-100`}>
                                    <TrashIcon className="h-4 w-4 text-red-600" />
                                </div>
                            );
                        } else { // 'added'
                            actionText = 'agregó';
                            icon = (
                                <div className={`${iconContainerBaseClasses} ${styles.addedBg}`}>
                                    <UserIcon className={`h-4 w-4 ${styles.addedText}`} />
                                </div>
                            );
                        }

                        return (
                            <li key={activity.id} className="flex items-start space-x-4">
                                {icon}
                                <div>
                                    <p className="text-sm text-gray-700">
                                        <span className={`font-bold ${styles.text}`}>{activity.user}</span> {actionText} <span className="font-semibold text-gray-800">{activity.itemName}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {formatRelativeTime(activity.date)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay actividad reciente para mostrar.</p>
            )}
        </div>
    );
};

export default ActividadReciente;