'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const testUsers = [
  { email: 'admin@hospital.com', password: 'Admin@123456', role: 'ADMIN', name: 'System Administrator' },
  { email: 'doctor1@hospital.com', password: 'Doctor@123456', role: 'DOCTOR', name: 'James Smith' },
  { email: 'doctor2@hospital.com', password: 'Doctor@123456', role: 'DOCTOR', name: 'Sarah Johnson' },
  { email: 'nurse1@hospital.com', password: 'Nurse@123456', role: 'NURSE', name: 'Emily Brown' },
  { email: 'nurse2@hospital.com', password: 'Nurse@123456', role: 'NURSE', name: 'Michael Davis' },
  { email: 'lab@hospital.com', password: 'Lab@123456', role: 'LAB', name: 'Lab Technician' },
  { email: 'pharmacy@hospital.com', password: 'Pharmacy@123456', role: 'PHARMACY', name: 'Henry Kiplagat' },
  { email: 'reception@hospital.com', password: 'Reception@123456', role: 'RECEPTION', name: 'Grace Kariuki' },
  { email: 'finance@hospital.com', password: 'Finance@123456', role: 'FINANCE', name: 'David Mwangi' },
];

interface UserStatus {
  email: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

export default function SetupWizardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>(
    testUsers.map((u) => ({ email: u.email, status: 'pending' }))
  );
  const [allCompleted, setAllCompleted] = useState(false);

  const createAllUsers = async () => {
    setIsLoading(true);
    setUserStatuses(testUsers.map((u) => ({ email: u.email, status: 'loading' })));

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      
      try {
        const response = await fetch('/api/admin/create-test-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            role: user.role,
            firstName: user.name.split(' ')[0],
            lastName: user.name.split(' ').slice(1).join(' '),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setUserStatuses((prev) =>
            prev.map((u) =>
              u.email === user.email
                ? { ...u, status: 'error', message: error.message || 'Failed to create user' }
                : u
            )
          );
        } else {
          setUserStatuses((prev) =>
            prev.map((u) =>
              u.email === user.email ? { ...u, status: 'success', message: 'Created successfully' } : u
            )
          );
        }
      } catch (error) {
        setUserStatuses((prev) =>
          prev.map((u) =>
            u.email === user.email
              ? { ...u, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }
              : u
          )
        );
      }

      // Small delay between creates
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsLoading(false);
    const allSuccess = userStatuses.every((u) => u.status === 'success');
    setAllCompleted(allSuccess);
  };

  const successCount = userStatuses.filter((u) => u.status === 'success').length;
  const errorCount = userStatuses.filter((u) => u.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🏥 Hospital Test Setup</h1>
          <p className="text-slate-300">Create all 9 test users for system testing</p>
        </div>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup Users</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Test Users</CardTitle>
                <CardDescription>Automatically create all 9 test users with one click</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{testUsers.length}</div>
                    <div className="text-sm text-slate-400">Total Users</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{successCount}</div>
                    <div className="text-sm text-slate-400">Created</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">{errorCount}</div>
                    <div className="text-sm text-slate-400">Failed</div>
                  </div>
                </div>

                {/* User Status List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userStatuses.map((userStatus) => {
                    const user = testUsers.find((u) => u.email === userStatus.email);
                    return (
                      <div
                        key={userStatus.email}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {userStatus.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full bg-slate-500"></div>
                          )}
                          {userStatus.status === 'loading' && (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          )}
                          {userStatus.status === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          )}
                          {userStatus.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <div className="font-medium text-white text-sm">{user?.name}</div>
                            <div className="text-xs text-slate-400">{userStatus.email}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">{user?.role}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Error Messages */}
                {userStatuses.some((u) => u.status === 'error') && (
                  <div className="p-4 rounded-lg border border-red-500 bg-red-500/10 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-red-200">
                      Some users failed to create. Check the status above.
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {allCompleted && successCount === testUsers.length && (
                  <div className="p-4 rounded-lg border border-green-500 bg-green-500/10 flex gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-green-200">
                      ✅ All test users created successfully! Check the Credentials tab to see login info.
                    </div>
                  </div>
                )}

                {/* Create Button */}
                <Button
                  onClick={createAllUsers}
                  disabled={isLoading || allCompleted}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLoading ? 'Creating Users...' : allCompleted ? 'All Users Created ✓' : 'Create All Test Users'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Test User Credentials</CardTitle>
                <CardDescription>Use these to login and test the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-600">
                      <tr className="text-slate-400">
                        <th className="text-left py-2 px-3">Role</th>
                        <th className="text-left py-2 px-3">Email</th>
                        <th className="text-left py-2 px-3">Password</th>
                        <th className="text-left py-2 px-3">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {testUsers.map((user) => (
                        <tr key={user.email} className="text-white">
                          <td className="py-3 px-3">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-sm">{user.email}</td>
                          <td className="py-3 px-3 font-mono text-sm">{user.password}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {user.role === 'ADMIN'
                              ? 'Administration'
                              : user.role === 'DOCTOR' || user.role === 'NURSE'
                              ? 'OPD'
                              : user.role === 'LAB'
                              ? 'Laboratory'
                              : user.role === 'PHARMACY'
                              ? 'Pharmacy'
                              : 'Other'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Test Instructions */}
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <h4 className="font-semibold text-white mb-2">🧪 Test Instructions:</h4>
                  <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Create test users by clicking the button in the Setup tab</li>
                    <li>Go to <code className="bg-slate-800 px-2 py-1 rounded text-xs">http://localhost:3000/sign-in</code></li>
                    <li>Login with any email/password from above</li>
                    <li>Verify profile dropdown shows correct role and name</li>
                    <li>Test RBAC: Admin can visit <code className="bg-slate-800 px-2 py-1 rounded text-xs">/dashboard/users</code>, others can't</li>
                    <li>Test auto-department: Department auto-selects based on role in forms</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
