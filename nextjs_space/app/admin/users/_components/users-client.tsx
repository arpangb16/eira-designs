'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, User, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

interface UsersClientProps {
  initialUsers: UserData[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole !== 'ADMIN') {
      toast({
        title: 'Error',
        description: 'You cannot remove your own admin role',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(userId);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updatedUser.role } : u));
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Admins have access to all features. Regular users can only access the Creator page.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={user.id === currentUserId ? 'border-blue-500 border-2' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">{user.name || 'No name'}</h3>
                        {user.id === currentUserId && (
                          <Badge className="border-gray-400 text-gray-700 bg-white">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1 text-gray-700">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      className={`px-3 py-1 ${user.role === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 border-gray-400'}`}
                    >
                      {user.role === 'ADMIN' ? (
                        <><Shield className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        <><User className="h-3 w-3 mr-1" /> User</>
                      )}
                    </Badge>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
