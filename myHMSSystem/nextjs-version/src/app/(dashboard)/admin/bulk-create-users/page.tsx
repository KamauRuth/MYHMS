'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Loader2, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

interface UserForm {
  id: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface CreatedUser {
  email: string;
  password: string;
  role: string;
  status: 'success' | 'error';
  message?: string;
}

const roleOptions = [
  { value: 'DOCTOR', label: '👨‍⚕️ Doctor' },
  { value: 'NURSE', label: '👩‍⚕️ Nurse' },
  { value: 'LAB', label: '🔬 Lab Technician' },
  { value: 'PHARMACY', label: '💊 Pharmacist' },
  { value: 'RECEPTION', label: '📞 Receptionist' },
  { value: 'FINANCE', label: '💰 Finance Officer' },
];

export default function BulkUserCreationPage() {
  const [forms, setForms] = useState<UserForm[]>([
    { id: '1', email: '', password: '', role: 'DOCTOR', firstName: '', lastName: '' },
  ]);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copied, setCopied] = useState<string | null>(null);

  const addForm = () => {
    const newId = (Math.max(...forms.map(f => parseInt(f.id)), 0) + 1).toString();
    setForms([...forms, { id: newId, email: '', password: '', role: 'DOCTOR', firstName: '', lastName: '' }]);
  };

  const removeForm = (id: string) => {
    if (forms.length > 1) {
      setForms(forms.filter(f => f.id !== id));
    }
  };

  const updateForm = (id: string, field: keyof UserForm, value: string) => {
    setForms(forms.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createUsers = async () => {
    setIsCreating(true);
    setCreatedUsers([]);

    for (const form of forms) {
      if (!form.email || !form.password || !form.role) {
        setCreatedUsers(prev => [...prev, {
          email: form.email || 'Unknown',
          password: form.password,
          role: form.role,
          status: 'error',
          message: 'Missing required fields (email, password, role)'
        }]);
        continue;
      }

      try {
        const response = await fetch('/api/admin/create-test-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            role: form.role,
            firstName: form.firstName,
            lastName: form.lastName,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setCreatedUsers(prev => [...prev, {
            email: form.email,
            password: form.password,
            role: form.role,
            status: 'success',
            message: 'User created successfully'
          }]);
        } else {
          setCreatedUsers(prev => [...prev, {
            email: form.email,
            password: form.password,
            role: form.role,
            status: 'error',
            message: data.message || 'Failed to create user'
          }]);
        }
      } catch (error) {
        setCreatedUsers(prev => [...prev, {
          email: form.email,
          password: form.password,
          role: form.role,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }]);
      }

      // Small delay between creates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsCreating(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportCredentials = () => {
    const csv = ['Email,Password,Role,First Name,Last Name', ...createdUsers.map(u => 
      `${u.email},${u.password},${u.role}`
    )].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-credentials.csv';
    a.click();
  };

  const successCount = createdUsers.filter(u => u.status === 'success').length;
  const errorCount = createdUsers.filter(u => u.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👥 Bulk User Creation</h1>
          <p className="text-slate-300">Create multiple staff members at once</p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Users</TabsTrigger>
            <TabsTrigger value="results">Results ({createdUsers.length})</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Staff Members</CardTitle>
                <CardDescription>Fill in the details for each user you want to create</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Forms Container */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                  {forms.map((form, index) => (
                    <div key={form.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 space-y-4">
                      {/* Form Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">User #{index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeForm(form.id)}
                          disabled={forms.length === 1}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">Email *</Label>
                          <Input
                            type="email"
                            placeholder="user@hospital.com"
                            value={form.email}
                            onChange={(e) => updateForm(form.id, 'email', e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">Role *</Label>
                          <Select value={form.role} onValueChange={(value) => updateForm(form.id, 'role', value)}>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* First Name */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">First Name</Label>
                          <Input
                            placeholder="John"
                            value={form.firstName}
                            onChange={(e) => updateForm(form.id, 'firstName', e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>

                        {/* Last Name */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">Last Name</Label>
                          <Input
                            placeholder="Doe"
                            value={form.lastName}
                            onChange={(e) => updateForm(form.id, 'lastName', e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-slate-300">Password *</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder="Enter password"
                              value={form.password}
                              onChange={(e) => updateForm(form.id, 'password', e.target.value)}
                              className="bg-slate-800 border-slate-600 text-white flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateForm(form.id, 'password', generatePassword())}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              Generate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={addForm}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    + Add Another User
                  </Button>
                  <Button
                    onClick={createUsers}
                    disabled={isCreating || forms.some(f => !f.email || !f.password || !f.role)}
                    size="lg"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isCreating ? 'Creating Users...' : `Create ${forms.length} User${forms.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Creation Results</CardTitle>
                <CardDescription>
                  {createdUsers.length === 0 ? 'No users created yet' : `${successCount} successful, ${errorCount} failed`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                {createdUsers.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-blue-400">{createdUsers.length}</div>
                      <div className="text-sm text-slate-400">Total</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">{successCount}</div>
                      <div className="text-sm text-slate-400">Successful</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-red-400">{errorCount}</div>
                      <div className="text-sm text-slate-400">Failed</div>
                    </div>
                  </div>
                )}

                {/* Results List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {createdUsers.map((user, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        user.status === 'success'
                          ? 'bg-green-500/10 border-green-500'
                          : 'bg-red-500/10 border-red-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {user.status === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <div>
                              <div className="font-medium text-white">{user.email}</div>
                              <div className="text-sm text-slate-400">{user.role}</div>
                            </div>
                          </div>
                          {user.message && (
                            <div className="text-sm mt-2 text-slate-300">{user.message}</div>
                          )}
                        </div>

                        {/* Password Display */}
                        {user.status === 'success' && (
                          <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded border border-slate-600">
                            <code className="text-sm font-mono text-slate-300">
                              {showPasswords[user.email] ? user.password : '••••••••'}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setShowPasswords(prev => ({
                                  ...prev,
                                  [user.email]: !prev[user.email]
                                }))
                              }
                              className="w-8 h-8 text-slate-400 hover:text-slate-200"
                            >
                              {showPasswords[user.email] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(`${user.email}:${user.password}`, user.email)}
                              className="w-8 h-8 text-slate-400 hover:text-slate-200"
                            >
                              {copied === user.email ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export Button */}
                {successCount > 0 && (
                  <Button
                    onClick={exportCredentials}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    📥 Export Credentials as CSV
                  </Button>
                )}

                {createdUsers.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p>Create users to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
