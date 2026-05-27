<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(): Response
    {
        // Only super-admin can access this page
        abort_unless(auth()->user()->permission === 'super-admin', 403);

        $users = User::orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'permission' => $user->permission,
                'is_current' => $user->id === auth()->id(),
            ]);

        return Inertia::render('settings/users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->permission === 'super-admin', 403);

        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:8|confirmed',
            'permission' => 'required|in:admin,super-admin',
        ]);

        User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'permission' => $request->permission,
        ]);

        return back()->with('success', 'User created successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_unless(auth()->user()->permission === 'super-admin', 403);

        // Cannot delete yourself
        abort_if($user->id === auth()->id(), 403, 'You cannot delete your own account.');

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}